import { LinkupClient, type TextSearchResult } from 'linkup-sdk';
import { env } from '@/env';
import {
  WEBSEARCH_RESULT_CONTENT_LENGTH_LIMIT,
  WEBSEARCH_RESULTS_LIMIT,
} from '@/configuration-text-inputs/const';
import { logError, logWarning } from '@shared/logging';

/**
 * Performs a web search using the Linkup API and returns text search results.
 * Search results can be used in the rag context of the system prompt.
 *
 * @param query The search query string.
 * @param isWebSearchEnabled Flag indicating if web search is enabled for the user's federal state.
 * @returns An array of text search results from the Linkup API.
 */
export async function searchWeb(
  query: string,
  isWebSearchEnabled: boolean | undefined,
): Promise<TextSearchResult[]> {
  if (!isWebSearchEnabled) {
    return [];
  }

  if (!env.linkupApiKey) {
    logWarning('Web search is enabled but LINKUP_API_KEY is not set');
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
