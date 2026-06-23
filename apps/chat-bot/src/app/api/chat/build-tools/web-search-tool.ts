import type { ToolDefinition } from '@ais-chat/ai-core';
import type { WebSearchResult } from '@shared/db/schema';
import type { UserAndContext } from '@/auth/types';
import { searchWeb } from '../websearch';
import type { ToolHandler } from './types';

type WebSearchToolResult = {
  title: string | null;
  url: string | null;
  content: string | null;
};

type WebSearchToolResponse = {
  results: WebSearchToolResult[];
  error: string | null;
};

type CreateWebSearchToolParams = {
  user: UserAndContext;
  conversationId: string;
  onWebSearchResults?: (results: WebSearchResult[]) => void;
  webSearchResults: WebSearchResult[];
};

export function createWebSearchTool({
  user,
  conversationId,
  onWebSearchResults,
  webSearchResults,
}: CreateWebSearchToolParams): { definition: ToolDefinition; handler: ToolHandler } {
  const definition: ToolDefinition = {
    name: 'web_search',
    description:
      'Search the web for current information. Call this tool immediately and without asking for permission whenever the user asks about recent events, news, current data (weather, prices, scores), or any facts that may have changed after your knowledge cutoff. Call this tool at most ONCE per user message. After receiving the results, synthesize them into a direct answer — do not call the tool again with a different query.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'A concise search query (max 10 words) that captures the key information need. Write it in the same language as the user.',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  };

  const handler: ToolHandler = async (args) => {
    const query = typeof args.query === 'string' ? args.query : '';
    const results = await searchWeb({
      query,
      conversationId,
      userId: user.id,
    });

    const response: WebSearchToolResponse = {
      results: results.map((result) => ({
        title: result.name?.trim() ?? null,
        url: result.url ?? null,
        content: result.content?.trim() ?? null,
      })),
      error: null,
    };

    webSearchResults.push(...results);
    onWebSearchResults?.(results);

    if (results.length === 0) {
      response.error = 'No results found.';
      return JSON.stringify(response);
    }

    return JSON.stringify(response);
  };

  return {
    definition,
    handler,
  };
}
