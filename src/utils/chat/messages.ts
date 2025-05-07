import { ConversationMessageModel } from '@/db/types';
import { Message } from 'ai';


export function convertMessageModelToMessage(
  messages: Array<ConversationMessageModel>,
): Array<Message> {
  // @ts-expect-error tool is filtered out
  return messages
    .filter((message) => message.role !== 'tool')
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    }));
}


