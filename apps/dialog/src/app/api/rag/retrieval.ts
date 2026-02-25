import { db } from '@shared/db';
import { fileTable, TextChunkTable } from '@shared/db/schema';
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
