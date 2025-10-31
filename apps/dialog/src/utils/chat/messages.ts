import { ConversationMessageModel } from '@shared/db/types';
import { Message } from 'ai';

export function convertMessageModelToMessage(
  messages: Array<ConversationMessageModel>,
): Array<Message> {
  return messages
    .filter((message) => message.role !== 'tool')
    .map((message) => ({
      id: message.id,
      // Todo Anton: Please check the typing here
      // I got an error that 'tool' is not assignable to type 'system' | 'user' | 'assistant' | 'data'
      // Regarding documentation of ai package in version 4, 'tool' is valid
      // Version of ai packages did not change but after moving code to shared package this error appeared
      role: message.role as Exclude<ConversationMessageModel['role'], 'tool'>,
      content: message.content,
      createdAt: message.createdAt,
    }));
}
