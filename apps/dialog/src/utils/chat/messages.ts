import { ConversationMessageModel } from '@shared/db/types';
import { type ChatMessage } from '@/types/chat';

/**
 * Converts database conversation message models to AI library message format.
 * Filters out 'data' role messages which are not used in chat.
 *
 * @param messages - Array of conversation messages from the database
 * @returns Array of messages compatible with the chat format
 */
export function convertMessageModelToMessage(
  messages: Array<ConversationMessageModel>,
): Array<ChatMessage> {
  return messages
    .filter(
      (message) =>
        message.role === 'user' || message.role === 'assistant' || message.role === 'system',
    )
    .map((message) => ({
      id: message.id,
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
      createdAt: message.createdAt,
    }));
}
