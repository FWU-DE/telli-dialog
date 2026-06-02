import type { ToolDefinition } from '@ais-chat/ai-core';
import { UserAndContext } from '@/auth/types';
import { isWebSearchEnabled, searchWeb } from './websearch';
import type { ToolHandler } from './agent-loop';
import type { WebSearchResult } from '@shared/db/schema';

type BuildToolsParams = {
  user: UserAndContext;
  characterId?: string;
  assistantId?: string;
  conversationId: string;
  onWebSearchResults?: (results: WebSearchResult[]) => void;
};

type BuildToolsResult = {
  tools: ToolDefinition[];
  toolHandlers: Record<string, ToolHandler>;
  webSearchResults: WebSearchResult[];
};

export async function buildTools({
  user,
  characterId,
  assistantId,
  conversationId,
  onWebSearchResults,
}: BuildToolsParams): Promise<BuildToolsResult> {
  const tools: ToolDefinition[] = [];
  const toolHandlers: Record<string, ToolHandler> = {};
  const webSearchResults: WebSearchResult[] = [];

  const webSearchEnabled = await isWebSearchEnabled({ user, characterId, assistantId });

  if (webSearchEnabled) {
    tools.push({
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
    });

    toolHandlers['web_search'] = async (args) => {
      const results = await searchWeb({
        query: args.query as string,
        conversationId,
        userId: user.id,
      });

      webSearchResults.push(...results);
      onWebSearchResults?.(results);

      if (results.length === 0) {
        return 'No results found.';
      }
      return results.map((r) => `[${r.name}](${r.url})\n${r.content}`).join('\n\n---\n\n');
    };
  }

  return { tools, toolHandlers, webSearchResults };
}
