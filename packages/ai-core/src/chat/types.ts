import { LlmModel } from '../api-db';

/**
 * Attachment type for images in messages.
 */
export type ChatAttachment = {
  contentType: string;
  url: string;
  type: 'image';
};

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  attachments?: ChatAttachment[];
};

export type TextGenerationArgs = {
  messages: Message[];
  model: string;
  maxTokens?: number;
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

export type TextStreamFn = (
  args: TextGenerationArgs,
  onComplete?: (usage: TokenUsage) => void | Promise<void>,
) => AsyncGenerator<string>;

// TODO: Just an alias for now, since the llmModel table needs renaming (it has image and embedding models too)
export type AiModel = LlmModel;
