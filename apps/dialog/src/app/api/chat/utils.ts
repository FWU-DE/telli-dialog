import { ImageAttachment } from '@/utils/files/types';
import { logError } from '@shared/logging';
import { type ChatMessage as Message } from '@/types/chat';
import { generateTextWithBilling } from '@telli/ai-core';

/**
 * Format messages to include images for models that support vision
 */
export function formatMessagesWithImages(
  messages: Message[],
  images: ImageAttachment[],
  modelSupportsImages: boolean,
): Message[] {
  if (!modelSupportsImages || images.length === 0) {
    return messages;
  }

  const messagesWithImages = [...messages];

  for (const message of messagesWithImages) {
    if (message.role !== 'user') {
      continue;
    }

    const messageImages = images.filter((image) => image.conversationMessageId === message.id);
    if (messageImages.length === 0) {
      continue;
    }
    message.experimental_attachments = messageImages.map((image) => ({
      contentType: image.mimeType ?? 'image/jpeg',
      url: image.url,
      type: 'image' as const,
    }));
  }

  return messagesWithImages;
}

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function consolidateMessages(messages: Array<Message>): Array<Message> {
  const consolidatedMessages: Array<Message> = [];

  for (let i = 0; i < messages.length; i++) {
    const currentMessage = messages[i];
    if (currentMessage === undefined) {
      continue;
    }
    const prevMessage = consolidatedMessages[consolidatedMessages.length - 1];

    // If this message has the same role as the previous one, merge them
    if (prevMessage && prevMessage.role === currentMessage?.role) {
      prevMessage.content += '\n\n' + currentMessage.content;
    } else {
      // Otherwise add as a new message
      consolidatedMessages.push({ ...currentMessage });
    }
  }

  return consolidatedMessages;
}

/**
 * Limits chat history by keeping the first message pairs, last message pairs, and filling remaining space
 * with middle messages (prioritizing more recent ones), while respecting character limits.
 *
 * @param messages - The messages to limit
 * @param limitRecent - Number of recent message pairs to keep (e.g. 2 means 2 user + 2 assistant messages)
 * @param limitFirst - Number of first message pairs to keep (default: 2)
 * @param characterLimit - Maximum total characters allowed
 * @returns Limited message array with prioritized recent context
 */
export function limitChatHistory({
  messages,
  limitRecent,
  limitFirst = 2,
  characterLimit,
}: {
  messages: Array<Message>;
  limitRecent: number;
  limitFirst?: number;
  characterLimit: number;
}): Array<Message> {
  const consolidatedMessages = consolidateMessages(messages);

  // Convert pairs to individual message counts
  const maxFirst = limitFirst * 2;
  const maxRecent = limitRecent * 2;

  // If we have fewer messages or less characters than the limits, just return all messages
  const totalChars = consolidatedMessages.reduce((sum, msg) => sum + msg.content.length, 0);
  if (consolidatedMessages.length <= maxFirst + maxRecent || totalChars <= characterLimit) {
    return consolidatedMessages;
  }

  // Get mandatory messages
  const firstMessages = consolidatedMessages.slice(0, maxFirst);
  const recentMessages = consolidatedMessages.slice(-maxRecent);

  // Get middle messages in reverse order (most recent first)
  const startIndex = maxFirst;
  const endIndex = consolidatedMessages.length - maxRecent;
  const middleMessages = consolidatedMessages.slice(startIndex, endIndex).reverse();

  // Build result: first + recent, as they are mandatory
  const result = [...firstMessages, ...recentMessages];
  let charCount = result.reduce((sum, msg) => sum + msg.content.length, 0);

  // Add middle messages that fit within the character limit
  const middleToAdd: Message[] = [];
  for (const msg of middleMessages) {
    if (charCount + msg.content.length <= characterLimit) {
      middleToAdd.unshift(msg); // Add to front to maintain chronological order
      charCount += msg.content.length;
    } else {
      break;
    }
  }

  // Insert middle messages between first and recent
  result.splice(firstMessages.length, 0, ...middleToAdd);

  return result;
}

/**
 * Generate a chat title based on the first user message
 * @param message - The first user message
 * @param modelId - The ID of the model to use for title generation
 * @param apiKeyId - The API key ID for billing
 * @returns A string representing the generated chat title
 */
export async function getChatTitle({
  message,
  modelId,
  apiKeyId,
}: {
  message: Message;
  modelId: string;
  apiKeyId: string;
}): Promise<string> {
  try {
    const { text } = await generateTextWithBilling(
      modelId,
      [
        {
          role: 'system',
          content: `Du erstellst einen kurzen Titel basierend auf der ersten Nachricht eines Nutzers
  
Regeln:
1. Der Titel sollte eine Zusammenfassung der Nachricht sein
2. Verwende keine Anführungszeichen oder Doppelpunkte
3. Der Titel sollte nicht länger als 80 Zeichen sein
`,
        },
        {
          role: 'user',
          content: message.content,
        },
      ],
      apiKeyId,
    );
    return text.trim();
  } catch (error) {
    logError('Error generating chat title, using default title as fallback:', error);
    return 'Neue Konversation';
  }
}
