import type { LlmModel } from '@ais-chat/api-database';

export type Usage = {
  input_text_tokens: number;
  output_text_tokens?: number;
  output_image_tokens: number;
};

export type ImageResponse = {
  // Base64-encoded images
  data: Array<string>;
  output_format?: 'png' | 'webp' | 'jpeg';
  usage?: Usage;
};

/** Options for image output, such as size.
 * size: The size must have the correct aspect ratio that is supported by the model
 */
export type ImageOutputOptions = {
  size: string; // e.g. "1024x1024", "1536x1024", "1408x768"
};

export type ImageGenerationRequestOptions = {
  output: ImageOutputOptions;
};

export type ImageGenerationFn = (args: {
  prompt: string;
  model: string;
  options?: ImageGenerationRequestOptions;
}) => Promise<ImageResponse>;

// TODO: Just an alias for now, since the llmModel table needs renaming (it has image and embedding models too)
export type AiModel = LlmModel;
