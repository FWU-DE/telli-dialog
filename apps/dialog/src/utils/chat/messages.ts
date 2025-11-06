import { ConversationMessageModel } from '@shared/db/types';
import { Message } from 'ai';
import { parseHyperlinks } from '../web-search/parsing';
import { LocalFileState } from '@/components/chat/send-message-form';

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

// returns true if user input contains files or web links
export function doesUserInputContainLinkOrFile(
  input: string,
  files?: Map<string, LocalFileState>,
): boolean {
  const links = parseHyperlinks(input);
  return (files && files.size > 0) || (!!links && links.length > 0);
}
