import { ConversationMessageModel } from '@shared/db/types';
import { Message } from 'ai';

/**
 * Converts database conversation message models to AI library message format.
 *
 * @param messages - Array of conversation messages from the database
 * @returns Array of messages compatible with the AI library format
 */
export function convertMessageModelToMessage(
  messages: Array<ConversationMessageModel>,
): Array<Message> {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  }));
}
