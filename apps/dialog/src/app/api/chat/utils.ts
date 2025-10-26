import { ImageAttachment } from '@/utils/files/types';
import { generateText, LanguageModelV1, type Message } from 'ai';

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
      contentType: image.mimeType,
      url: image.url,
      type: 'image',
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
 * Limits the chat history to the most recent messages, keeping the first N messages and the last N messages.
 * @param messages - The messages to limit.
 * @param limitRecent - The number of recent message-pairs to keep e.g. 2 means 2 user messages and 2 assistant messages.
 * @param limitFirst - The number of first message-pairs to keep.
 * @param characterLimit - The maximum number of characters to keep.
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
  // Validate inputs

  // First consolidate consecutive messages from the same role
  const consolidatedMessages = consolidateMessages(messages);

  // Always include the last user message even if limitRecent == 0
  limitRecent = limitRecent * 2;
  limitFirst = limitFirst * 2;

  // If we have fewer messages or less characters than the limits, just return all messages
  if (
    consolidatedMessages.length <= limitFirst + limitRecent ||
    consolidatedMessages.reduce(
      (totalContentlength, { content }) => totalContentlength + content.length,
      0,
    ) <= characterLimit
  ) {
    return consolidatedMessages;
  }

  // Initialize arrays for front and back messages
  const frontMessages: Message[] = consolidatedMessages.slice(0, limitFirst);
  const backMessages: Message[] = [];

  let runningTotal = frontMessages.reduce((acc, message) => acc + message.content.length, 0);
  let manadatoryMessagesIncluded = false;

  for (
    let backIndex = consolidatedMessages.length - 1;
    backMessages.length + frontMessages.length < consolidatedMessages.length;
    backIndex--
  ) {
    const backMessage = consolidatedMessages[backIndex];

    if (backMessage === undefined) continue;

    runningTotal += backMessage.content.length;
    backMessages.unshift(backMessage);

    manadatoryMessagesIncluded = backIndex <= consolidatedMessages.length - limitRecent;
    if (manadatoryMessagesIncluded && runningTotal > characterLimit) {
      break;
    }
  }

  // Combine front and back messages
  return [...frontMessages, ...backMessages];
}

/**
 * Condenses chat history into a search query for vector search and text retrieval
 * @param messages - The chat messages to condense
 * @param model - The LLM model to use for condensing
 * @returns A string representing the search query
 */
export async function condenseChatHistory({
  messages,
  model,
}: {
  messages: Array<Message>;
  model: LanguageModelV1;
}): Promise<string> {
  // Use only the most recent messages for generating the search query
  const recentMessages = limitChatHistory({
    messages,
    limitRecent: 6,
    limitFirst: 3,
    characterLimit: 2000,
  });

  try {
    const { text } = await generateText({
      model,
      system: `Du bist ein hilfreicher Assistent, der Suchanfragen erstellt.
Basierend auf dem Chatverlauf, erstelle eine präzise Suchanfrage.
Die Suchanfrage sollte die Hauptfrage oder das Hauptthema des Benutzers erfassen.
Halte die Suchanfrage kurz und prägnant (maximal 200 Zeichen).

ACHTUNG: Gib NUR die Suchanfrage zurück, ohne zusätzliche Erklärungen oder Formatierungen.
Beantworte NICHT die Frage des Benutzers, sondern erstelle eine präzise Suchanfrage.

Beispiel:

Benutzer: "Ich möchte wissen, ob ich in meinem Bundesland einen Anspruch auf Elterngeld habe."
Suchanfrage: "Elterngeld Anspruch"
`,
      messages: recentMessages.map((m) => ({ role: m.role, content: m.content })),
    });

    return text.trim();
  } catch (error) {
    console.error('Error condensing chat history:', error);
    // Fallback: Use the last user message as the search query
    const lastUserMessage = messages.findLast((m) => m.role === 'user');
    return lastUserMessage?.content.slice(0, 200) || '';
  }
}

export async function getKeywordsFromQuery({
  messages,
  model,
}: {
  messages: Array<Message>;
  model: LanguageModelV1;
}): Promise<string[]> {
  const { text } = await generateText({
    model,
    system: `Du bist ein Experte für die präzise Extraktion von Schlüsselwörtern. Deine Aufgabe ist es, die relevantesten Schlüsselwörter aus der gegebenen Suchanfrage (der letzten Benutzernachricht im Chatverlauf) zu extrahieren.

Regeln:
1. Extrahiere nur die wichtigsten, fachspezifischen Schlüsselwörter
2. Entferne allgemeine Wörter, Artikel und Präpositionen
3. Behalte zusammengesetzte Begriffe als einzelne Schlüsselwörter
4. Verwende die Grundform der Wörter
5. Gib die Schlüsselwörter als kommaseparierte Liste zurück
6. Maximal 5 Schlüsselwörter pro Anfrage
7. Schlüsselwörter sollten spezifisch und aussagekräftig sein
8. Falls keine Schlüsselwörter gefunden werden können, gib ein Leerzeichen zurück

Beispiele:
Eingabe: "Wie kann ich einen Antrag auf Elterngeld stellen?"
Ausgabe: "Elterngeld,Antrag,Anspruch"

Eingabe: "Was sind die Voraussetzungen für Arbeitslosengeld?"
Ausgabe: "Arbeitslosengeld,Voraussetzungen,Berechtigung"

Eingabe: "Wo finde ich Informationen über Kindergeld?"
Ausgabe: "Kindergeld,Informationen,Leitfaden"

Eingabe: "qwertz"
Ausgabe: " "
`,
    messages,
  });
  return text.trim().split(',');
}

export async function getChatTitle({
  messages,
  model,
}: {
  messages: Array<Message>;
  model: LanguageModelV1;
}): Promise<string> {
  const { text } = await generateText({
    model,
    system: `Du erstellst einen kurzen Titel basierend auf der ersten Nachricht eines Nutzers
  
Regeln:
1. Der Titel sollte eine Zusammenfassung der Nachricht sein
2. Verwende keine Anführungszeichen oder Doppelpunkte
3. Der Titel sollte nicht länger als 80 Zeichen sein
`,
    messages,
    maxTokens: 30,
  });
  return text.trim();
}
