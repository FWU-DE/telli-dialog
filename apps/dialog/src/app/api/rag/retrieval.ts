import { db } from '@shared/db';
import { fileTable, chunkTable } from '@shared/db/schema';
import { desc, eq, inArray, SQL, sql } from 'drizzle-orm';
import { type VectorSearchResult } from './types';

/**
 * Finds chunks most similar to the query embedding using cosine similarity (pgvector).
 *
 * @param embedding - The query embedding vector
 * @param fileIds - The IDs of files to search within
 * @param limit - Maximum number of results to return
 * @returns Array of text chunks sorted by embedding similarity
 */
export async function vectorSearch({
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
      id: chunkTable.id,
      content: chunkTable.content,
      fileId: chunkTable.fileId,
      pageNumber: chunkTable.pageNumber,
      fileName: fileTable.name,
      orderIndex: chunkTable.orderIndex,
      sourceType: chunkTable.sourceType,
      sourceUrl: chunkTable.sourceUrl,
      embeddingSimilarity:
        sql`1 - (${chunkTable.embedding} <=> ${JSON.stringify(embedding)})` as SQL<number>,
    })
    .from(chunkTable)
    .innerJoin(fileTable, eq(chunkTable.fileId, fileTable.id))
    .where(inArray(chunkTable.fileId, fileIds))
    .limit(limit)
    .orderBy((t) => [desc(t.embeddingSimilarity)]);
}
