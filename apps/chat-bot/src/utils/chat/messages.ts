import { ConversationMessageModel } from '@shared/db/types';
import { type ChatMessage } from '@/types/chat';

/**
 * Converts database conversation message models to frontend message format.
 *
 * @param messages - Array of conversation messages from the database
 * @returns Array of messages compatible with the chat format
 */
export function convertMessageModelToMessage(
  messages: Array<ConversationMessageModel>,
): Array<ChatMessage> {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    webSearchResults: message.webSearchResults ?? undefined,
    toolCalls: message.toolCalls ?? undefined,
    toolCallId: message.toolCallId ?? undefined,
  }));
}
