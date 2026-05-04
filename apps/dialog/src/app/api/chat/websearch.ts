import { LinkupClient, type TextSearchResult } from 'linkup-sdk';
import { generateTextWithBilling } from '@telli/ai-core';
import { env } from '@/env';
import {
  WEBSEARCH_RESULT_CONTENT_LENGTH_LIMIT,
  WEBSEARCH_RESULTS_LIMIT,
} from '@/configuration-text-inputs/const';
import { logError } from '@shared/logging';

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

Antworte ausschließlich mit "ja" oder "nein".

Antworte "ja", wenn die Frage:
- Nach aktuellen Ereignissen, Nachrichten oder neuesten Informationen fragt
- Aktuelle Daten erfordert (z.B. Wetter, Aktienkurse, Sportergebnisse)
- Sich auf bestimmte Webseiten, Artikel oder Online-Ressourcen bezieht
- Etwas betrifft, das sich häufig ändert

Antworte "nein", wenn die Frage:
- Eine allgemeine Wissensfrage ist, die keine aktuellen Informationen erfordert
- Um Hilfe bei Code, Mathematik, Schreiben oder kreativen Aufgaben bittet
- Eine persönliche oder alltägliche Frage ist
- Mit allgemeinem Wissen beantwortet werden kann`,
        },
        { role: 'user', content: query },
      ],
      apiKeyId,
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
export async function searchWeb(query: string): Promise<TextSearchResult[]> {
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

    if (!Array.isArray(searchResults.results)) {
      return [];
    }

    return (searchResults.results as TextSearchResult[])
      .slice(0, WEBSEARCH_RESULTS_LIMIT)
      .map((result) => ({
        ...result,
        content: result.content.slice(0, WEBSEARCH_RESULT_CONTENT_LENGTH_LIMIT),
      }));
  } catch (error) {
    logError('Error during web search', error);
    return [];
  }
}
