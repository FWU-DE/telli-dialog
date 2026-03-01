import { ChunkInsertModel, ChunkSourceType, FileModelAndContent } from '@shared/db/schema';
import { type ChatMessage as Message } from '@/types/chat';
import { UserAndContext } from '@/auth/types';
import { chunkText } from './chunking';
import { embedText, embedChunks } from './embedding';
import { vectorSearch } from './retrieval';
import { RetrievedChunk, UnembeddedChunk } from './types';
import { FILE_SEARCH_LIMIT } from '@/configuration-text-inputs/const';
import { logError } from '@shared/logging';

/**
 * Chunks and embeds text.
 *
 * @param textElements - Input text
 * @param fileId - The ID to associate chunks with
 * @param federalStateId - The federal state ID of the user
 * @returns Embedded text chunks ready for DB insertion
 */
export async function chunkAndEmbed({
  text,
  fileId,
  sourceUrl,
  sourceType,
  federalStateId,
}: {
  text: string;
  fileId?: string;
  sourceUrl?: string;
  sourceType?: ChunkSourceType;
  federalStateId: string;
}): Promise<ChunkInsertModel[]> {
  if (text.trim() === '') {
    return [];
  }

  const chunks = await chunkText(text);

  const enrichedChunks: UnembeddedChunk[] = chunks.map((content, index) => ({
    fileId: fileId ?? null,
    sourceUrl: sourceUrl ?? null,
    sourceType,
    content,
    orderIndex: index,
  }));

  return embedChunks({
    chunksWithoutEmbeddings: enrichedChunks,
    federalStateId,
  });
}

/**
 * Retrieves relevant chunks for a set of messages using vector search.
 *
 * @param messages - The conversation messages
 * @param user - The authenticated user context
 * @param relatedFileEntities - File entities to search within
 * @param sourceUrls - Optional source URLs to search within
 * @returns The most relevant chunks
 */
export async function retrieveChunks({
  messages,
  user,
  relatedFileEntities,
  sourceUrls,
}: {
  messages: Message[];
  user: UserAndContext;
  relatedFileEntities: FileModelAndContent[];
  sourceUrls?: string[];
}): Promise<RetrievedChunk[]> {
  if (relatedFileEntities.length === 0 && (!sourceUrls || sourceUrls.length === 0)) {
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
    sourceUrls,
    limit: FILE_SEARCH_LIMIT,
  });

  return chunks;
}
