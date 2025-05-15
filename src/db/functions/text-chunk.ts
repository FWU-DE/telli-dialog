import { db } from '@/db';
import { textChunkTable, TextChunkInsertModel } from '@/db/schema';

export async function dbCreateManyTextChunks({
  chunks,
}: {
  chunks: TextChunkInsertModel[];
}) {
  const textChunks = await db.insert(textChunkTable).values(chunks).returning();

  return textChunks;
}

