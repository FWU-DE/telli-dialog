import { LlmModel } from "src/temp-db";

export type ImageResponse = {
  // Base64-encoded images
  data: Array<string>;
  output_format: 'png' | 'webp' | 'jpeg';
};

export type ImageGenerationFn = (args: { prompt: string; model: string }) => Promise<ImageResponse>;

// Just an alias for now, since the llmModel table needs renaming (it has image and embedding models too)
export type AiModel = LlmModel;