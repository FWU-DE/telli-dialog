import { TextChunkInsertModel, FileModelAndContent } from '@shared/db/schema';
import { type ChatMessage as Message } from '@/types/chat';
import { UserAndContext } from '@/auth/types';
import { chunkText, groupAndSortChunks } from './chunking';
import { embedText, embedChunks } from './embedding';
import { vectorSearch } from './retrieval';
import { Chunk, TextElement } from './types';
import { FILE_SEARCH_LIMIT } from '@/configuration-text-inputs/const';
import { logError } from '@shared/logging';

/**
 * Chunks and embeds text elements.
 *
 * @param textElements - Extracted text elements (e.g. pages from a PDF, or a single text block)
 * @param fileId - The ID to associate chunks with
 * @param federalStateId - The federal state ID of the user
 * @param sentenceChunkOverlap - Number of overlapping sentences between chunks
 * @param lowerBoundWordCount - Minimum word count per chunk
 * @returns Embedded text chunks ready for DB insertion
 */
export async function chunkAndEmbed({
  textElements,
  fileId,
  federalStateId,
  sentenceChunkOverlap = 1,
  lowerBoundWordCount = 200,
}: {
  textElements: TextElement[];
  fileId: string;
  federalStateId: string;
  sentenceChunkOverlap?: number;
  lowerBoundWordCount?: number;
}): Promise<TextChunkInsertModel[]> {
  const chunksWithoutEmbeddings: Omit<TextChunkInsertModel, 'embedding'>[] = textElements.flatMap(
    (element) =>
      chunkText({
        text: element.text,
        sentenceChunkOverlap,
        lowerBoundWordCount,
      }).map((chunk, index) => ({
        pageNumber: element.page ?? null,
        fileId,
        orderIndex: index,
        content: chunk.content,
        leadingOverlap: chunk.leadingOverlap,
        trailingOverlap: chunk.trailingOverlap,
      })),
  );

  return embedChunks({
    chunksWithoutEmbeddings,
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
}): Promise<Record<string, Chunk[]> | undefined> {
  if (relatedFileEntities.length === 0) {
    return undefined;
  }

  const lastUserMessage = messages.findLast((m) => m.role === 'user');
  const searchQuery = lastUserMessage?.content ?? '';

  if (searchQuery.trim() === '') {
    return undefined;
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
    fileIds: fileIds ?? [],
    limit: FILE_SEARCH_LIMIT,
  });

  return groupAndSortChunks(chunks);
}
