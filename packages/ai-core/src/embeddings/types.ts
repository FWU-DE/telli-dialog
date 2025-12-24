import { LlmModel } from '../api-db';

export type EmbeddingResponse = {
  embeddings: number[][];
};

export type EmbeddingGenerationFn = (args: {
  texts: string[];
  model: string;
}) => Promise<EmbeddingResponse>;

export type AiModel = LlmModel;
