/**
 * Status of a chat conversation.
 */
export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

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
