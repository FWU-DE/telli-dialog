import OpenAI from 'openai';
import { ChatCompletionMessageParam, CompletionUsage } from 'openai/resources/index.js';

export type CommonLlmProviderStreamParameter = {
  messages: Array<ChatCompletionMessageParam>;
  model: string;
  temperature?: number;
  max_tokens: number | undefined | null;
  onUsageCallback(data: CompletionUsage): void;
};

export type CompletionStreamFn = (
  args: CommonLlmProviderStreamParameter,
) => Promise<ReadableStream>;

export type CompletionFn = (args: {
  messages: ChatCompletionMessageParam[];
  model: string;
  temperature?: number;
  max_tokens: number | undefined | null;
}) => Promise<OpenAI.Chat.Completions.ChatCompletion>;

export type EmbeddingFn = (args: {
  input: string | string[];
  model: string;
}) => Promise<OpenAI.Embeddings.Embedding>;

export type ImageGenerationFn = (args: {
  prompt: string;
  model: string;
}) => Promise<OpenAI.Images.ImagesResponse>;
