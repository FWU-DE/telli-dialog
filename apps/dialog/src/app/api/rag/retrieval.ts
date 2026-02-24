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
import { type Chunk, type VectorSearchResult, type FullTextSearchResult } from './types';

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
  const retrievedTextChunks = await hybridSearch({
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
export async function hybridSearch({ keywords, embedding, fileIds, limit = 10 }: SearchOptions) {
  if (embedding.length === 0) {
    return [];
  }

  const [embeddingResults, textRankResults] = await Promise.all([
    vectorSearch({ embedding, fileIds: fileIds ?? [], limit }),
    fullTextSearch({ keywords, fileIds: fileIds ?? [], limit }),
  ]);

  return fuseResults(embeddingResults, textRankResults, limit);
}

/**
 * Merges vector and full-text search results using Reciprocal Rank Fusion.
 * Each result gets a rank position from each list (or MAX_SAFE_INTEGER if absent),
 * and the final score is the average of both ranks (lower is better).
 *
 * @param embeddingResults - Results from vector search with their similarity scores
 * @param textRankResults - Results from full-text search with their text rank scores
 * @param limit - Maximum number of results to return after fusion
 * @returns Array of chunks sorted by combined relevance from both methods
 */
function fuseResults(
  embeddingResults: VectorSearchResult[],
  textRankResults: FullTextSearchResult[],
  limit: number,
): Chunk[] {
  const fusedMap = new Map<string, Chunk & { embeddingRank: number; textRank: number }>();

  embeddingResults.forEach((result, index) => {
    fusedMap.set(result.id, {
      ...result,
      embeddingRank: index + 1,
      textRank: Number.MAX_SAFE_INTEGER,
    });
  });

  textRankResults.forEach((result, index) => {
    const existing = fusedMap.get(result.id);
    if (existing) {
      existing.textRank = index + 1;
    } else {
      fusedMap.set(result.id, {
        ...result,
        embeddingRank: Number.MAX_SAFE_INTEGER,
        textRank: index + 1,
      });
    }
  });

  return Array.from(fusedMap.values())
    .sort((a, b) => {
      const scoreA = (a.embeddingRank + a.textRank) / 2;
      const scoreB = (b.embeddingRank + b.textRank) / 2;
      return scoreA - scoreB;
    })
    .slice(0, limit);
}
