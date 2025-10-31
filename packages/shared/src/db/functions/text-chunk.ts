import { db } from '../../db';
import { TextChunkTable, TextChunkInsertModel } from '../../db/schema';

export async function dbCreateManyTextChunks({ chunks }: { chunks: TextChunkInsertModel[] }) {
  const textChunks = await db.insert(TextChunkTable).values(chunks).returning();

  return textChunks;
}
