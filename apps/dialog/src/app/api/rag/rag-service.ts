import { TextChunkInsertModel, FileModelAndContent } from '@shared/db/schema';
import { type ChatMessage as Message } from '@/types/chat';
import { UserAndContext } from '@/auth/types';
import { chunkText, groupAndSortChunks } from './chunking';
import { embedText, embedTextChunks } from './embedding';
import { hybridSearch } from './retrieval';
import { TextElement } from './types';
import { condenseChatHistory, getKeywordsFromQuery } from '../chat/utils';
import { FILE_SEARCH_LIMIT } from '@/configuration-text-inputs/const';
import { logError } from '@shared/logging';

/**
 * Ingests raw text elements by chunking and embedding them.
 *
 * This is the pure RAG pipeline: text → chunks → embeddings.
 * File-specific concerns (extraction, S3 upload, DB insert) stay with the caller.
 *
 * @param textElements - Extracted text elements (e.g. pages from a PDF, or a single text block)
 * @param fileId - The ID to associate chunks with
 * @param federalStateId - Used to resolve the embedding API key
 * @param sentenceChunkOverlap - Number of overlapping sentences between chunks (default: 1)
 * @param lowerBoundWordCount - Minimum word count per chunk (default: 200)
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

  return embedTextChunks({
    values: chunksWithoutEmbeddings,
    fileId,
    federalStateId,
  });
}

/**
 * Retrieves relevant chunks for a set of messages using hybrid search.
 *
 * Condenses chat history into a search query, extracts keywords,
 * generates a query embedding, and performs hybrid vector + full-text search.
 *
 * @param messages - The conversation messages
 * @param user - The authenticated user context
 * @param relatedFileEntities - File entities to search within
 * @param modelId - The auxiliary LLM model ID (for query condensation / keyword extraction)
 * @param apiKeyId - The API key for the auxiliary model
 * @returns Grouped and sorted chunks keyed by fileId, or undefined if no files
 */
export async function retrieveChunks({
  messages,
  user,
  relatedFileEntities,
  modelId,
  apiKeyId,
}: {
  messages: Message[];
  user: UserAndContext;
  relatedFileEntities: FileModelAndContent[];
  modelId: string;
  apiKeyId: string;
}) {
  if (relatedFileEntities.length === 0) {
    return undefined;
  }

  const [searchQuery, keywords] = await Promise.all([
    condenseChatHistory({ messages, modelId, apiKeyId }),
    getKeywordsFromQuery({ messages, modelId, apiKeyId }),
  ]);

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
  const chunks = await hybridSearch({
    keywords,
    embedding: queryEmbedding,
    fileIds,
    limit: FILE_SEARCH_LIMIT,
  });

  return groupAndSortChunks(chunks);
}
