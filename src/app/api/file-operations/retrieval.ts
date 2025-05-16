import { db } from '@/db';
import { textChunkTable } from '@/db/schema';
import { sql, inArray, desc, SQL } from 'drizzle-orm';

interface SearchOptions {
  query: string;
  embedding: number[];
  fileIds?: string[];
  limit?: number;
  minSimilarity?: number;
}

/**
 * Search for relevant text chunks using both embedding similarity and full-text search
 * @param options Search parameters including query text, embedding vector, and optional filters
 * @returns Array of text chunks sorted by relevance
 */
export async function searchTextChunks({
  query,
  embedding,
  fileIds,
  limit = 10,
  minSimilarity = 0.7,
}: SearchOptions) {
  // Build the base query
  const embeddingResults = await db
    .select({
      id: textChunkTable.id,
      content: textChunkTable.content,
      fileId: textChunkTable.fileId,
      pageNumber: textChunkTable.pageNumber,
      orderIndex: textChunkTable.orderIndex,
      // Calculate embedding similarity score (cosine similarity)
      embeddingSimilarity:
        sql`1 - (${textChunkTable.embedding} <=> ${JSON.stringify(embedding)})` as SQL<number>,
    })
    .from(textChunkTable)
    .where(inArray(textChunkTable.fileId, fileIds ?? []))
    .limit(limit)
    .orderBy((t) => [desc(t.embeddingSimilarity)]);

  // Calculate text rank for each chunk see documentation https://orm.drizzle.team/docs/guides/postgresql-full-text-search
  const textRankResults = await db
    .select({
      id: textChunkTable.id,
      content: textChunkTable.content,
      fileId: textChunkTable.fileId,
      pageNumber: textChunkTable.pageNumber,
      orderIndex: textChunkTable.orderIndex,
      textRank:
        sql`ts_rank_cd(${textChunkTable.contentTsv}, to_tsquery('german', ${query.replace(/\s+/g, ' & ')}))` as SQL<number>,
    })
    .from(textChunkTable)
    .where(inArray(textChunkTable.fileId, fileIds ?? []))
    .limit(limit)
    .orderBy((t) => [desc(t.textRank)]);

  // Create a map to store all unique results
  const combinedResultsMap = new Map();

  // Process embedding results with rank position
  embeddingResults.forEach((result, index) => {
    combinedResultsMap.set(result.id, {
      ...result,
      embeddingRank: index + 1, // 1-based rank
      textRank: Number.MAX_SAFE_INTEGER, // Default rank if not in text results
      combinedRankScore: 0, // Will be calculated after both lists are processed
    });
  });

  // Process text rank results with rank position
  textRankResults.forEach((result, index) => {
    if (combinedResultsMap.has(result.id)) {
      // Update existing entry with text rank position
      const existingEntry = combinedResultsMap.get(result.id);
      existingEntry.textRank = index + 1; // 1-based rank
    } else {
      // Add new entry
      combinedResultsMap.set(result.id, {
        ...result,
        embeddingRank: Number.MAX_SAFE_INTEGER, // Default rank if not in embedding results
        textRank: index + 1, // 1-based rank
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

  return combinedResults;
}
