import { ChunkInsertModel, ChunkSelectModel } from '@shared/db/schema';

export type UnembeddedChunk = Omit<ChunkInsertModel, 'embedding'>;

export type RetrievedChunk = Omit<ChunkSelectModel, 'embedding' | 'createdAt'> & {
  fileName: string;
};
