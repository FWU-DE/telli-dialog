import { logError } from '@shared/logging';
import { ChatMessage, type ChatMessage as Message } from '@/types/chat';
import {
  ChatImageAttachment,
  generateTextWithBilling,
  isChatImageAttachment,
} from '@ais-chat/ai-core';
import { LlmModelSelectModel } from '@shared/db/schema';
import { UnexpectedError } from '@shared/error/unexpected-error';

/**
 * Enrich messages with image data from attachments.
 * If the model supports images, it adds either the image URL
 * or the base64-encoded image data to the message, depending on the model's requirements.
 */
export function enrichMessagesWithImageData(
  messages: Message[],
  images: ChatImageAttachment[],
  modelSupportsImages: boolean,
  imageIntegrationType: 'url' | 'base64',
): Message[] {
  if (!modelSupportsImages || images.length === 0) {
    return messages;
  }

  const messagesWithImages: ChatMessage[] = [...messages];

  for (const message of messagesWithImages) {
    if (message.role !== 'user') {
      continue;
    }

    if (images.length === 0) {
      continue;
    }
    message.experimental_attachments = images.map((image) => {
      if (isChatImageAttachment(image)) return image;

      throw new UnexpectedError(`Unsupported image integration type: ${imageIntegrationType}`);
    });
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
  const maxTitleLength = 50;
  const fallbackTitle = 'Neue Konversation';

  try {
    const { text } = await generateTextWithBilling(
      modelId,
      [
        {
          role: 'system',
          content: `Erstelle einen kurzen Titel basierend auf der Nachricht eines Nutzers
  
## Regeln
- Der Titel soll das zentrale Thema der Nachricht erfassen und Interesse wecken, damit der Nutzer die Konversation später leicht wiederfinden kann.
- Verwende keine Anführungszeichen oder Doppelpunkte.
- Verwende keine Emojis oder Sonderzeichen.
- Verwende reinen Text ohne Formatierungen.
- Der Titel sollte nicht länger als ${maxTitleLength} Zeichen sein.
- Antworte nur mit dem Titel, ohne weitere Erklärungen oder Einleitungen.
- Antworte nicht auf die Nachricht des Nutzers, sondern generiere ausschließlich einen passenden Titel dafür.
- Wenn die Nachricht des Nutzers kein klares Thema hat, generiere einen allgemeinen Titel wie "Neue Konversation".
`,
        },
        {
          role: 'user',
          content: message.content,
        },
      ],
      apiKeyId,
    );

    // Remove whitespace, then cut to the length limit character-by-character
    const title = Array.from(text.replace(/\s+/g, ' ').trim()).slice(0, maxTitleLength).join('');
    return title || fallbackTitle;
  } catch (error) {
    logError('Error generating chat title, using default title as fallback:', error);
    return fallbackTitle;
  }
}

/**
 * Some models (like google anthropic) require the image data to be included in the message as a base64 encoded string,
 * while others can work with just the image url. This function conditionally includes the base64 encoded data if required by the model.
 */
export function determineImageAttachmentTypeForModel(model: LlmModelSelectModel): 'url' | 'base64' {
  // we do not have settings on the LlmModelSelectModel to determine if the model needs image data,
  // so we will use the model name as a heuristic for now
  if (model.provider === 'google' && model.name.startsWith('anthropic/')) {
    return 'base64';
  }
  return 'url';
}
