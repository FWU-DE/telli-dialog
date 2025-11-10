import { ConversationMessageModel } from '@shared/db/types';
import { Message } from 'ai';
import { parseHyperlinks } from '../web-search/parsing';
import { LocalFileState } from '@/components/chat/send-message-form';

/**
 * Converts database conversation message models to AI library message format.
 *
 * @param messages - Array of conversation messages from the database
 * @returns Array of messages compatible with the AI library format
 */
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

/**
 * Determines whether a user message contains any attachments.
 *
 * @param input - The user's message text to analyze for web links
 * @param files - Optional map of local file states representing uploaded files
 * @returns `true` if the message contains files or web links, `false` otherwise
 */
export function messageContainsAttachments(
  input: string,
  files?: Map<string, LocalFileState>,
): boolean {
  const links = parseHyperlinks(input);
  return (files && files.size > 0) || (!!links && links.length > 0);
}
