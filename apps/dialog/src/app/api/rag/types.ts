import { TextChunkSelectModel } from '@shared/db/schema';

export type Chunk = Omit<TextChunkSelectModel, 'embedding' | 'contentTsv' | 'createdAt'> & {
  fileName: string;
};

// Shared type between extraction and retrieval
export type TextElement = {
  page?: number;
  text: string;
};

export type VectorSearchResult = Chunk & { embeddingSimilarity: number };
