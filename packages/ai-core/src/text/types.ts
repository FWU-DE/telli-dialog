import { LlmModel } from '../api-db';

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type TextGenerationArgs = {
  prompt: string;
  model: string;
  history?: Message[];
};

export type TokenUsage = {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
};

export type TextResponse = {
  text: string;
  usage: TokenUsage;
};

export type TextGenerationFn = (args: TextGenerationArgs) => Promise<TextResponse>;

export type TextStreamFn = (args: TextGenerationArgs) => AsyncGenerator<string, TokenUsage>;

// TODO: Just an alias for now, since the llmModel table needs renaming (it has image and embedding models too)
export type AiModel = LlmModel;
