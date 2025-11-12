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
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
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
