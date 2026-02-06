import { LlmModel } from '../api-db';

export type EmbeddingResponse = {
  embeddings: number[][];
};

export type EmbeddingGenerationFn = (args: {
  texts: string[];
  model: string;
}) => Promise<EmbeddingResponse>;

// TODO: Rename this when the llmModel table is renamed (it has image and embedding models too)
export type AiModel = LlmModel;
