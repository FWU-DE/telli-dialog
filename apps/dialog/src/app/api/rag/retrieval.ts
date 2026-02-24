import { db } from '@shared/db';
import { FileModelAndContent, fileTable, TextChunkTable } from '@shared/db/schema';
import { and, desc, eq, inArray, SQL, sql } from 'drizzle-orm';
import { groupAndSortChunks } from '../rag/chunking';
import { condenseChatHistory, getKeywordsFromQuery } from '../chat/utils';
import { embedText } from '../rag/embedding';
import { FILE_SEARCH_LIMIT } from '@/configuration-text-inputs/const';
import { UserAndContext } from '@/auth/types';
import { type ChatMessage as Message } from '@/types/chat';
import { logError } from '@shared/logging';
import { type VectorSearchResult, type FullTextSearchResult } from './types';

type SearchOptions = {
  keywords: string[];
  embedding: number[];
  fileIds?: string[];
  limit?: number;
};

export async function getRelevantContent({
  modelId,
  apiKeyId,
  messages,
  user,
  relatedFileEntities,
}: {
  modelId: string;
  apiKeyId: string;
  messages: Message[];
  user: UserAndContext;
  relatedFileEntities: FileModelAndContent[];
}) {
  if (relatedFileEntities.length === 0) {
    return undefined;
  }

  const [searchQuery, keywords] = await Promise.all([
    condenseChatHistory({
      messages,
      modelId,
      apiKeyId,
    }),
    getKeywordsFromQuery({
      messages,
      modelId,
      apiKeyId,
    }),
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

  const relatedFileEntityIds = relatedFileEntities.map((file) => file.id);
  const retrievedTextChunks = await searchTextChunks({
    keywords,
    embedding: queryEmbedding,
    fileIds: relatedFileEntityIds,
    limit: FILE_SEARCH_LIMIT,
  });

  return groupAndSortChunks(retrievedTextChunks);
}

/**
 * Finds chunks most similar to the query embedding using cosine similarity (pgvector).
 *
 * @param embedding - The query embedding vector
 * @param fileIds - The IDs of files to search within
 * @param limit - Maximum number of results to return
 * @returns Array of text chunks sorted by embedding similarity
 */
async function vectorSearch({
  embedding,
  fileIds,
  limit,
}: {
  embedding: number[];
  fileIds: string[];
  limit: number;
}): Promise<VectorSearchResult[]> {
  return db
    .select({
      id: TextChunkTable.id,
      content: TextChunkTable.content,
      fileId: TextChunkTable.fileId,
      pageNumber: TextChunkTable.pageNumber,
      fileName: fileTable.name,
      orderIndex: TextChunkTable.orderIndex,
      leadingOverlap: TextChunkTable.leadingOverlap,
      trailingOverlap: TextChunkTable.trailingOverlap,
      embeddingSimilarity:
        sql`1 - (${TextChunkTable.embedding} <=> ${JSON.stringify(embedding)})` as SQL<number>,
    })
    .from(TextChunkTable)
    .innerJoin(fileTable, eq(TextChunkTable.fileId, fileTable.id))
    .where(inArray(TextChunkTable.fileId, fileIds))
    .limit(limit)
    .orderBy((t) => [desc(t.embeddingSimilarity)]);
}

/**
 * Finds chunks matching the given keywords using PostgreSQL full-text search (tsvector).
 * Returns only chunks with a positive text rank.
 *
 * @param keywords - The keywords to search for
 * @param fileIds - The IDs of files to search within
 * @param limit - Maximum number of results to return
 * @returns Array of matching text chunks with their text rank scores
 */
async function fullTextSearch({
  keywords,
  fileIds,
  limit,
}: {
  keywords: string[];
  fileIds: string[];
  limit: number;
}): Promise<FullTextSearchResult[]> {
  // Remove any non-alphanumeric characters and filter out empty strings
  const cleanedKeywords = keywords
    .map((k) => k.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((k) => k.length > 0);

  if (cleanedKeywords.length === 0) {
    return [];
  }

  const tsQuery = cleanedKeywords.join(' | ');

  return db
    .select({
      id: TextChunkTable.id,
      content: TextChunkTable.content,
      fileId: TextChunkTable.fileId,
      fileName: fileTable.name,
      leadingOverlap: TextChunkTable.leadingOverlap,
      trailingOverlap: TextChunkTable.trailingOverlap,
      pageNumber: TextChunkTable.pageNumber,
      orderIndex: TextChunkTable.orderIndex,
      textRank:
        sql`ts_rank_cd(${TextChunkTable.contentTsv}, to_tsquery('german', ${tsQuery}))` as SQL<number>,
    })
    .from(TextChunkTable)
    .innerJoin(fileTable, eq(TextChunkTable.fileId, fileTable.id))
    .where(
      and(
        inArray(TextChunkTable.fileId, fileIds),
        sql`ts_rank_cd(${TextChunkTable.contentTsv}, to_tsquery('german', ${tsQuery})) > 0`,
      ),
    )
    .limit(limit)
    .orderBy((t) => [desc(t.textRank)]);
}

/**
 * Search for relevant text chunks using both embedding similarity and full-text search
 * @param keywords - The keywords extracted from the query
 * @param embedding - The query embedding vector
 * @param fileIds - The IDs of files to search within
 * @param limit - Maximum number of results to return
 * @returns Array of text chunks sorted by relevance
 */
export async function searchTextChunks({
  keywords,
  embedding,
  fileIds,
  limit = 10,
}: SearchOptions) {
  // Build the base query
  if (embedding.length === 0) {
    return [];
  }

  const [embeddingResults, textRankResults] = await Promise.all([
    vectorSearch({ embedding, fileIds: fileIds ?? [], limit }),
    fullTextSearch({ keywords, fileIds: fileIds ?? [], limit }),
  ]);

  // Create a map to store all unique results
  const combinedResultsMap: Map<
    string,
    {
      id: string;
      content: string;
      fileId: string;
      pageNumber: number | null;
      orderIndex: number;
      embeddingRank: number;
      textRank: number;
      combinedRankScore: number;
      fileName: string;
      leadingOverlap: string | null;
      trailingOverlap: string | null;
    }
  > = new Map();

  // Process embedding results with rank position
  embeddingResults.forEach((result, index) => {
    combinedResultsMap.set(result.id, {
      ...result,
      embeddingRank: index + 1, // 1-based rank
      textRank: Number.MAX_SAFE_INTEGER, // Default rank if not in text results
      combinedRankScore: 0, // Will be calculated after both lists are processed
      fileName: result.fileName ?? '',
      leadingOverlap: result.leadingOverlap ?? null,
      trailingOverlap: result.trailingOverlap ?? null,
    });
  });

  // Process text rank results with rank position
  textRankResults.forEach((result, index) => {
    if (combinedResultsMap.has(result.id)) {
      // Update existing entry with text rank position
      const existingEntry = combinedResultsMap.get(result.id);
      if (existingEntry) {
        existingEntry.textRank = index + 1; // 1-based rank
      }
    } else {
      // Add new entry
      combinedResultsMap.set(result.id, {
        ...result,
        embeddingRank: Number.MAX_SAFE_INTEGER, // Default rank if not in embedding results
        textRank: index + 1, // 1-based rank
        combinedRankScore: 0, // Will be calculated after both lists are processed
        fileName: result.fileName ?? '', // Filename must be defined
        leadingOverlap: result.leadingOverlap ?? null,
        trailingOverlap: result.trailingOverlap ?? null,
      });
    }
  });

  // Calculate combined rank score (lower is better)
  for (const entry of combinedResultsMap.values()) {
    // Average of ranks (with equal weighting)
    entry.combinedRankScore = (entry.embeddingRank + entry.textRank) / 2;
  }

  // Convert map to array and sort by combined rank score (lower is better)
  const combinedResults = Array.from(combinedResultsMap.values())
    .sort((a, b) => a.combinedRankScore - b.combinedRankScore)
    .slice(0, limit);

  return combinedResults.slice(0, limit);
}
