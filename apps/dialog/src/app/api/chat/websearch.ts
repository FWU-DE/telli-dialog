import { LinkupClient } from 'linkup-sdk';
import { generateTextWithBilling } from '@telli/ai-core';
import { env } from '@/env';
import {
  WEBSEARCH_RESULT_LENGTH_LIMIT,
  WEBSEARCH_RESULTS_LIMIT,
} from '@/configuration-text-inputs/const';
import type { WebSearchResult } from '@shared/db/schema';
import { logError } from '@shared/logging';
import { dbInsertConversationToolCallUsage } from '@shared/db/functions/token-usage';
import { dbGetToolCallCostByName } from '@shared/db/functions/tool-call';

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

export async function isWebSearchNeeded({
  query,
  modelId,
  apiKeyId,
}: {
  query: string;
  modelId: string;
  apiKeyId: string;
}): Promise<boolean> {
  try {
    const { text } = await generateTextWithBilling(
      modelId,
      [
        {
          role: 'system',
          content: `Du bist ein Routing-Assistent, der entscheidet, ob eine Nutzerfrage eine Websuche erfordert.

Antworte mit genau einem Wort: "ja" oder "nein". Keine Erklärung.

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

Im Zweifel antworte "ja".

Beispiele:
- "Was ist Photosynthese?" → nein
- "Wer hat gestern das Spiel gewonnen?" → ja
- "Schreibe mir ein Gedicht über Katzen" → nein
- "Was kostet das iPhone 17?" → ja
- "Erkläre mir den Satz des Pythagoras" → nein
- "Was sind die neuesten Nachrichten zu KI?" → ja
- "hskjdfhskjdf" → nein`,
        },
        { role: 'user', content: query },
      ],
      apiKeyId,
      {
        maxTokens: 3,
        temperature: 0,
      },
    );

    return text.trim().toLowerCase().startsWith('ja');
  } catch (error) {
    logError('Error determining web search necessity, skipping web search:', error);
    return false;
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
    });

    await recordWebSearchUsage({
      conversationId,
      userId,
    });

    if (!Array.isArray(searchResults.results)) {
      return [];
    }

    return (searchResults.results as WebSearchResult[])
      .slice(0, WEBSEARCH_RESULTS_LIMIT)
      .map((result) => ({
        ...result,
        content: result.content.slice(0, WEBSEARCH_RESULT_LENGTH_LIMIT),
      }));
  } catch (error) {
    logError('Error during web search', error);
    return [];
  }
}
