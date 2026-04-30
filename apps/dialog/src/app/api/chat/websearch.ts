import { LinkupClient, type TextSearchResult } from 'linkup-sdk';
import { env } from '@/env';
import {
  WEBSERACH_RESULT_CONTENT_LENGTH_LIMIT,
  WEBSEARCH_RESULTS_LIMIT,
} from '@/configuration-text-inputs/const';

/**
 * Performs a web search using the Linkup API and returns text search results.
 * Search results can be used in the rag context of the system prompt.
 *
 * @param query The search query string.
 * @returns An array of text search results from the Linkup API.
 */
export async function searchWeb(query: string): Promise<TextSearchResult[]> {
  if (!env.linkupApiKey) {
    // will be replaced by federal state feature flag
    return [];
  }

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
      content: result.content.slice(0, WEBSERACH_RESULT_CONTENT_LENGTH_LIMIT),
    }));
}
