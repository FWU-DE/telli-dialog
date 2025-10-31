import { ConversationMessageModel } from '@shared/db/types';
import { Message } from 'ai';

export function convertMessageModelToMessage(
  messages: Array<ConversationMessageModel>,
): Array<Message> {
  const test = messages
    .filter((message) => message.role !== 'tool')
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    }));
  return test;
}
