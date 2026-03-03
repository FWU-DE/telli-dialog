import { ChunkInsertModel, FileModelAndContent } from '@shared/db/schema';
import { type ChatMessage as Message } from '@/types/chat';
import { UserAndContext } from '@/auth/types';
import { chunkText } from './chunking';
import { embedText, embedChunks } from './embedding';
import { vectorSearch } from './retrieval';
import { RetrievedChunk, UnembeddedChunk, TextElement } from './types';
import { FILE_SEARCH_LIMIT } from '@/configuration-text-inputs/const';
import { logError } from '@shared/logging';

/**
 * Chunks and embeds text elements.
 *
 * @param textElements - Extracted text elements (e.g. pages from a PDF, or a single text block)
 * @param fileId - The ID to associate chunks with
 * @param federalStateId - The federal state ID of the user
 * @returns Embedded text chunks ready for DB insertion
 */
export async function chunkAndEmbed({
  textElements,
  fileId,
  federalStateId,
}: {
  textElements: TextElement[];
  fileId: string;
  federalStateId: string;
}): Promise<ChunkInsertModel[]> {
  const allChunks = await Promise.all(
    textElements.map(async (element) => {
      const chunks = await chunkText(element.text);
      return chunks.map(
        (content, index): UnembeddedChunk => ({
          pageNumber: element.page ?? null,
          fileId,
          orderIndex: index,
          content,
        }),
      );
    }),
  );

  return embedChunks({
    chunksWithoutEmbeddings: allChunks.flat(),
    fileId,
    federalStateId,
  });
}

/**
 * Retrieves relevant chunks for a set of messages using vector search.
 *
 * @param messages - The conversation messages
 * @param user - The authenticated user context
 * @param relatedFileEntities - File entities to search within
 * @returns Grouped and sorted chunks keyed by fileId, or undefined if no files
 */
export async function retrieveChunks({
  messages,
  user,
  relatedFileEntities,
}: {
  messages: Message[];
  user: UserAndContext;
  relatedFileEntities: FileModelAndContent[];
}): Promise<RetrievedChunk[]> {
  if (relatedFileEntities.length === 0) {
    return [];
  }

  const lastUserMessage = messages.findLast((m) => m.role === 'user');
  const searchQuery = lastUserMessage?.content ?? '';

  if (searchQuery.trim() === '') {
    return [];
  }

  let queryEmbedding: number[] = [];
  try {
    const [embedding] = await embedText({
      text: [searchQuery],
      federalStateId: user.federalState.id,
    });
    queryEmbedding = embedding ?? [];
  } catch (error) {
    logError('Failed to generate embedding, using empty array as fallback:', error);
  }

  const fileIds = relatedFileEntities.map((file) => file.id);
  const chunks = await vectorSearch({
    embedding: queryEmbedding,
    fileIds,
    limit: FILE_SEARCH_LIMIT,
  });

  return chunks;
}
