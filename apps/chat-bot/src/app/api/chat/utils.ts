import { ImageAttachment } from '@/utils/files/types';
import { logError } from '@shared/logging';
import { type ChatMessage } from '@/types/chat';
import { generateTextWithBilling, type Message as AiCoreMessage } from '@ais-chat/ai-core';
import { TOTAL_CHAT_LENGTH_LIMIT } from '@/configuration-text-inputs/const';

/**
 * Format messages to include images for models that support vision
 */
export function formatMessagesWithImages(
  messages: ChatMessage[],
  images: ImageAttachment[],
  modelSupportsImages: boolean,
): ChatMessage[] {
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
    message.attachments = messageImages.map((image) => ({
      contentType: image.mimeType ?? 'image/jpeg',
      url: image.url,
      type: 'image' as const,
    }));
  }

  return messagesWithImages;
}

export function getMostRecentUserMessage(messages: Array<ChatMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function consolidateMessages(messages: Array<ChatMessage>): Array<ChatMessage> {
  const consolidatedMessages: Array<ChatMessage> = [];

  for (let i = 0; i < messages.length; i++) {
    const currentMessage = messages[i];
    if (currentMessage === undefined) {
      continue;
    }
    const prevMessage = consolidatedMessages[consolidatedMessages.length - 1];

    // If this message has the same role as the previous one, merge them
    // Do not merge tool-related messages (they carry toolCalls/toolCallId that must stay separate)
    const isToolRelated =
      currentMessage.role === 'tool' ||
      currentMessage.toolCalls?.length ||
      prevMessage?.toolCalls?.length;

    if (prevMessage && prevMessage.role === currentMessage?.role && !isToolRelated) {
      prevMessage.content += '\n\n' + currentMessage.content;
    } else {
      // Otherwise add as a new message
      consolidatedMessages.push({ ...currentMessage });
    }
  }

  return consolidatedMessages;
}

/**
 * Limits chat history by keeping as many recent messages as fit within the character limit.
 * Always keeps at least the last message.
 *
 * @param messages - The messages to limit
 * @param characterLimit - Maximum total characters allowed
 * @returns Limited message array with the most recent context that fits
 */
export function limitChatHistory(
  messages: Array<ChatMessage>,
  characterLimit: number = TOTAL_CHAT_LENGTH_LIMIT,
): Array<ChatMessage> {
  const consolidated = consolidateMessages(messages);
  if (consolidated.length === 0) return [];

  // Always keep at least the last message
  let startIndex = consolidated.length - 1;
  let charCount = consolidated[startIndex]!.content.length;

  // Include older messages while within character limit
  while (startIndex > 0) {
    const msg = consolidated[startIndex - 1]!;
    if (charCount + msg.content.length > characterLimit) break;
    charCount += msg.content.length;
    startIndex--;
  }

  return consolidated.slice(startIndex);
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
  message: ChatMessage;
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
 * Converts frontend messages to ai-core message format
 */
export function convertToAiCoreMessages(
  systemPrompt: string,
  messages: ChatMessage[],
): AiCoreMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    ...messages
      .filter((msg) => msg.role !== 'system')
      .map(({ role, content, attachments, toolCalls, toolCallId }) => ({
        role,
        content,
        attachments,
        toolCalls,
        toolCallId,
      })),
  ];
}
