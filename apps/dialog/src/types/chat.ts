import type { SharedChatExpiredError, TelliPointsExceededError } from '@telli/ai-core/errors';

/**
 * Serialized error that can be safely transmitted across the Server Action boundary.
 */
export type SerializedError = {
  name: string;
  message: string;
};

/**
 * Status of a chat conversation.
 * - 'ready': Chat is ready for input
 * - 'submitted': Message has been submitted, waiting for response
 * - 'reasoning': Model is reasoning (for reasoning models like o1/o3)
 * - 'streaming': Response is being streamed
 * - 'error': An error occurred
 */
export type ChatStatus = 'ready' | 'submitted' | 'reasoning' | 'streaming' | 'error';

/**
 * Attachment type for images in messages.
 */
export type ChatAttachment = {
  contentType: string;
  url: string;
  type: 'image';
};

/**
 * Basic chat message type used throughout the application.
 * This replaces the Message type from the 'ai' package.
 */
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
  experimental_attachments?: ChatAttachment[];
};

/**
 * Result returned when sending a chat message.
 * The error field handles pre-streaming errors as a serialized plain object.
 */
export type SendMessageResult = {
  stream: ReadableStream<string>;
  messageId: string;
  error?: SerializedError;
};

/**
 * Creates a SendMessageResult with a serialized error.
 */
export function createErrorResult(
  error: TelliPointsExceededError | SharedChatExpiredError,
): SendMessageResult {
  return {
    stream: new ReadableStream<string>({
      start(controller) {
        controller.close(); // already closed stream
      },
    }),
    messageId: crypto.randomUUID(),
    error: { name: error.name, message: error.message },
  };
}

/**
 * Reconstructs an Error from a serialized error object.
 */
export function deserializeError(serialized: SerializedError): Error {
  const error = new Error(serialized.message);
  error.name = serialized.name;
  return error;
}

/**
 * Text part of a UI message for rendering.
 */
export type TextUIPart = {
  type: 'text';
  text: string;
};

/**
 * UI-ready message with parts for rendering.
 * This replaces the UIMessage type from the 'ai' package.
 */
export type UIMessage = ChatMessage & {
  parts: TextUIPart[];
};

/**
 * Convert ChatMessage[] to UIMessage[] for rendering.
 */
export function toUIMessages(messages: ChatMessage[]): UIMessage[] {
  return messages.map((m) => ({
    ...m,
    parts: [{ type: 'text' as const, text: m.content }],
  }));
}

/**
 * Convert UIMessage[] to ChatMessage[] (strips parts).
 */
export function toChatMessages(messages: UIMessage[]): ChatMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));
}
