import { ChunkInsertModel, ChunkSelectModel } from '@shared/db/schema';

export type UnembeddedChunk = Omit<ChunkInsertModel, 'embedding'>;

export type RetrievedChunk = Omit<ChunkSelectModel, 'embedding' | 'createdAt'> & {
  fileName: string;
};

// Shared type between extraction and retrieval
export type TextElement = {
  page?: number;
  text: string;
};
