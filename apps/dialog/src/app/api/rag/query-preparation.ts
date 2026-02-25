import { logError } from '@shared/logging';
import { type ChatMessage as Message } from '@/types/chat';
import { generateTextWithBilling } from '@telli/ai-core';
import { limitChatHistory } from '../chat/utils';

/**
 * Condenses chat history into a search query for vector search
 * @param messages - The chat messages to condense
 * @param modelId - The ID of the model to use for condensing
 * @param apiKeyId - The API key ID for billing
 * @returns A string representing the search query
 */
export async function condenseChatHistory({
  messages,
  modelId,
  apiKeyId,
}: {
  messages: Array<Message>;
  modelId: string;
  apiKeyId: string;
}): Promise<string> {
  // Use only the most recent messages for generating the search query
  const recentMessages = limitChatHistory({
    messages,
    limitRecent: 6,
    limitFirst: 3,
    characterLimit: 2000,
  });

  try {
    const { text } = await generateTextWithBilling(
      modelId,
      [
        {
          role: 'system',
          content: `Du bist ein hilfreicher Assistent, der semantische Suchanfragen (Vektor-Suche) für eine Wissensdatenbank erstellt.
Basierend auf dem Chatverlauf, erstelle eine präzise Suchanfrage.
Die Suchanfrage sollte die Hauptfrage oder das Hauptthema des Benutzers erfassen.
Die Suchanfrage muss eigenständig und unabhängig vom Chatverlauf sein und alle notwendigen Kontextinformationen aus dem Verlauf enthalten, um die Hauptfrage oder das Hauptthema des Benutzers zu erfassen.
Halte die Suchanfrage kurz und prägnant (maximal 200 Zeichen).

Falls die Eingabe sinnlos oder irrelevant ist und keine sinnvolle Suchanfrage erstellt werden kann, gib nur die letzte Benutzernachricht als Suchanfrage zurück.

ACHTUNG: Gib NUR die Suchanfrage zurück, ohne zusätzliche Erklärungen oder Formatierungen.
Beantworte NICHT die Frage des Benutzers, sondern erstelle eine präzise Suchanfrage.

Beispiel:

Benutzer: "Ich möchte wissen, ob ich in meinem Bundesland einen Anspruch auf Elterngeld habe."
Suchanfrage: "Elterngeld Anspruch"
`,
        },
        ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
      ],
      apiKeyId,
    );

    return text.trim();
  } catch (error) {
    // Fallback: Use the last user message as the search query
    logError('Error condensing chat history, using last user message as fallback:', error);
    const lastUserMessage = messages.findLast((m) => m.role === 'user');
    return lastUserMessage?.content.slice(0, 200) || '';
  }
}
