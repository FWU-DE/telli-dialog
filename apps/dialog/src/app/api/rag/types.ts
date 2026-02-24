import { type ChunkResult } from './chunking';

// Shared type between extraction and retrieval
export type TextElement = {
  page?: number;
  text: string;
};

export type VectorSearchResult = ChunkResult & { embeddingSimilarity: number };
export type FullTextSearchResult = ChunkResult & { textRank: number };
