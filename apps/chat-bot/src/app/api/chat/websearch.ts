import { LinkupClient } from 'linkup-sdk';
import { generateTextWithBilling, type Message } from '@ais-chat/ai-core';
import { env } from '@/env';
import {
  WEBSEARCH_RESULT_LENGTH_LIMIT,
  WEBSEARCH_RESULTS_LIMIT,
} from '@/configuration-text-inputs/const';
import type { WebSearchResult } from '@shared/db/schema';
import { logError } from '@shared/logging';
import { dbInsertConversationToolCallUsage } from '@shared/db/functions/token-usage';
import { dbGetToolCallCostByName } from '@shared/db/functions/tool-call';
import { formatDateToGermanTimestamp } from '@shared/utils/date';
import { UserAndContext } from '@/auth/types';
import { HELP_MODE_ASSISTANT_ID } from '@shared/db/const';
import { dbGetAssistantById } from '@shared/db/functions/assistants';

export function isWebSearchAvailableForFederalState(
  federalState: UserAndContext['federalState'],
): boolean {
  return (federalState.featureToggles?.isWebSearchEnabled ?? false) && !!env.linkupApiKey;
}

export async function isWebSearchEnabled({
  user,
  characterId,
  assistantId,
}: {
  user: UserAndContext;
  characterId?: string;
  assistantId?: string;
}): Promise<boolean> {
  if (!isWebSearchAvailableForFederalState(user.federalState)) return false;
  if (characterId) return false;
  if (!assistantId) return true;
  if (assistantId === HELP_MODE_ASSISTANT_ID) return false;
  return (await dbGetAssistantById({ assistantId }))?.isWebSearchEnabled ?? false;
}

async function recordWebSearchUsage({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  let costsInCent = 0;

  try {
    costsInCent = (await dbGetToolCallCostByName('web_search')).costsInCent;
  } catch (error) {
    logError('Error loading web search tool call cost, using 0 cent fallback.', error);
  }

  try {
    await dbInsertConversationToolCallUsage({
      toolCallName: 'web_search',
      conversationId,
      userId,
      costsInCent,
    });
  } catch (error) {
    logError('Error recording web search usage billing.', error);
  }
}

async function isWebSearchNeeded({
  messages,
  modelId,
  apiKeyId,
}: {
  messages: Message[];
  modelId: string;
  apiKeyId: string;
}): Promise<{ needed: boolean; query: string }> {
  const recentMessages = messages.slice(-5).filter((message) => message.role !== 'system');

  try {
    const { text } = await generateTextWithBilling(
      modelId,
      [
        {
          role: 'system',
          content: `Du bist ein Routing-Assistent, der entscheidet, ob eine Nutzerfrage eine Websuche erfordert.
Heute ist der ${formatDateToGermanTimestamp(new Date())}.
Dir wird ein Gesprächsverlauf mit den letzten Nachrichten gegeben. Entscheide anhand des Kontexts, ob die letzte Nutzerfrage eine Websuche erfordert.

Antwortformat:
- Falls keine Websuche nötig ist: Antworte nur mit "nein".
- Falls eine Websuche nötig ist: Antworte mit "ja:" gefolgt von einer optimierten Suchanfrage in der Sprache des Nutzers.

Die Suchanfrage soll:
- Kurz und prägnant sein (max. 10 Wörter)
- In derselben Sprache wie die Nutzerfrage verfasst sein
- Alle relevanten Begriffe aus dem Kontext enthalten
- Eigenständig verständlich sein (keine Pronomen wie "es", "das", "dazu")

Antworte "ja", wenn die Frage:
- Nach aktuellen Ereignissen, Nachrichten oder neuesten Informationen fragt
- Zeitbezüge wie "heute", "gestern", "diese Woche", "aktuell" enthält
- Aktuelle Daten erfordert (z.B. Wetter, Aktienkurse, Sportergebnisse)
- Sich auf bestimmte Webseiten, Artikel oder Online-Ressourcen bezieht
- Fakten über Personen, Unternehmen oder Produkte betrifft, die sich ändern können
- Informationen nach deinem Wissensstand erfordert

Antworte "nein", wenn die Frage:
- Eine allgemeine Wissensfrage ist, die keine aktuellen Informationen erfordert
- Um Hilfe bei Code, Mathematik, Schreiben oder kreativen Aufgaben bittet
- Eine persönliche oder alltägliche Frage ist
- Mit allgemeinem Wissen beantwortet werden kann
- Eine Zusammenfassung oder Umformulierung von bereits gegebenem Text verlangt
- Keinen sinnvollen Inhalt hat (zufällige Zeichen, unverständlicher Text)

Im Zweifel antworte mit "ja:" und einer passenden Suchanfrage.

Beispiele:
- "Was ist Photosynthese?" → nein
- "Wer hat gestern das Fußballspiel gewonnen?" → ja: Fußball Spielergebnis gestern
- "Schreibe mir ein Gedicht über Katzen" → nein
- "Was kostet das iPhone 17?" → ja: iPhone 17 Preis aktuell
- "Erkläre mir den Satz des Pythagoras" → nein
- "Was sind die neuesten Nachrichten zu KI?" → ja: neueste Nachrichten künstliche Intelligenz
- "hskjdfhskjdf" → nein
- User: "Erzähl mir über Tesla" / Assistent: "Tesla ist..." / User: "Und wie steht die Aktie?" → ja: Tesla Aktienkurs aktuell`,
        },
        ...recentMessages,
      ],
      apiKeyId,
      {
        maxTokens: 60, // one token is ~0.75 words, so 60 tokens are ~45 words, which is more than enough for a search query
        temperature: 0,
      },
    );

    const trimmed = text.trim().toLowerCase();

    if (!trimmed.startsWith('ja')) {
      return { needed: false, query: '' };
    }

    const colonIndex = text.indexOf(':');
    const query = colonIndex !== -1 ? text.slice(colonIndex + 1).trim() : '';

    // fallback to last user message if the model indicates a web search is needed but doesn't provide a query
    if (!query) {
      const lastUserMessage = recentMessages.findLast((m) => m.role === 'user');
      return { needed: true, query: lastUserMessage?.content ?? '' };
    }

    return { needed: true, query };
  } catch (error) {
    logError('Error determining web search necessity, skipping web search:', error);
    return { needed: false, query: '' };
  }
}

/**
 * Performs a web search using the Linkup API and returns text search results.
 * Search results can be used in the rag context of the system prompt.
 *
 * @param query The search query string.
 * @returns An array of text search results from the Linkup API.
 */
export async function searchWeb({
  query,
  conversationId,
  userId,
}: {
  query: string;
  conversationId: string;
  userId: string;
}): Promise<WebSearchResult[]> {
  if (!env.linkupApiKey) {
    return [];
  }

  try {
    const linkupClient = new LinkupClient({
      apiKey: env.linkupApiKey,
    });

    const searchResults = await linkupClient.search({
      query: query,
      depth: 'standard',
      outputType: 'searchResults',
      maxResults: WEBSEARCH_RESULTS_LIMIT,
    });

    await recordWebSearchUsage({
      conversationId,
      userId,
    });

    if (!Array.isArray(searchResults.results)) {
      return [];
    }

    return (searchResults.results as WebSearchResult[]).map((result) => ({
      ...result,
      content: result.content.slice(0, WEBSEARCH_RESULT_LENGTH_LIMIT),
    }));
  } catch (error) {
    logError('Error during web search', error);
    return [];
  }
}

/**
 * Runs the full web search flow: checks if web search is enabled for the user and context,
 * determines whether the conversation requires a web search, and performs the search if needed.
 *
 * @param messages - The conversation message history used to determine search necessity.
 * @param user - The authenticated user and their context, including federal state feature toggles.
 * @param characterId - Optional character ID
 * @param assistantId - Optional assistant ID
 * @param modelId - The ID of the auxiliary model used for the search classification.
 * @param apiKeyId - The API key ID of the auxiliary model.
 * @param conversationId - The conversation ID.
 * @returns An array of web search results, or an empty array if search is disabled or not needed.
 */
export async function runWebSearchPipeline({
  messages,
  user,
  characterId,
  assistantId,
  modelId,
  apiKeyId,
  conversationId,
}: {
  messages: Message[];
  user: UserAndContext;
  characterId?: string;
  assistantId?: string;
  modelId: string;
  apiKeyId: string;
  conversationId: string;
}): Promise<WebSearchResult[]> {
  const enabled = await isWebSearchEnabled({ user, characterId, assistantId });
  if (!enabled) return [];

  const decision = await isWebSearchNeeded({ messages, modelId, apiKeyId });
  if (!decision.needed) return [];

  return searchWeb({ query: decision.query, conversationId, userId: user.id });
}
