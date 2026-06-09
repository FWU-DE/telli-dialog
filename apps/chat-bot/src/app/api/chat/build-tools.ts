import type { ToolDefinition } from '@ais-chat/ai-core';
import { UserAndContext } from '@/auth/types';
import { isWebSearchEnabled, searchWeb } from './websearch';
import type { ToolHandler } from './agent-loop';
import type { WebSearchResult } from '@shared/db/schema';
import type { FileModelAndContent } from '@shared/db/schema';
import { VECTOR_SEARCH_LIMIT } from '@/configuration-text-inputs/const';
import { retrieveChunksByQuery } from '../rag/rag-service';

function formatRetrievedChunksForTool(
  chunks: Awaited<ReturnType<typeof retrieveChunksByQuery>>,
  fileNames: string[],
) {
  const normalizedFileNames = fileNames.filter((fileName) => fileName.trim().length > 0);
  const fileList =
    normalizedFileNames.length > 0
      ? normalizedFileNames.map((fileName) => `- ${fileName}`).join('\n')
      : '- Keine Dateien verfügbar';

  if (chunks.length === 0) {
    return `Dateien:\n${fileList}\n\nKeine passenden Textstellen gefunden.`;
  }

  const chunkText = chunks
    .map(
      (chunk) =>
        `Datei: ${chunk.fileName ?? 'Unbekannte Datei'}${chunk.sourceUrl ? `\nQuelle: ${chunk.sourceUrl}` : ''}\nAbschnitt: ${chunk.orderIndex + 1}\n${chunk.content}`,
    )
    .join('\n\n---\n\n');

  return `Dateien:\n${fileList}\n\n${chunkText}`;
}

type BuildToolsParams = {
  user: UserAndContext;
  characterId?: string;
  learningScenarioId?: string;
  assistantId?: string;
  conversationId: string;
  relatedFileEntities: FileModelAndContent[];
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
  learningScenarioId,
  assistantId,
  conversationId,
  relatedFileEntities,
  onWebSearchResults,
}: BuildToolsParams): Promise<BuildToolsResult> {
  const tools: ToolDefinition[] = [];
  const toolHandlers: Record<string, ToolHandler> = {};
  const webSearchResults: WebSearchResult[] = [];
  const attachedFileNames = relatedFileEntities.map((file) => file.name);

  const webSearchEnabled = await isWebSearchEnabled({
    user,
    characterId,
    learningScenarioId,
    assistantId,
  });

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

  if (relatedFileEntities.length > 0) {
    tools.push({
      name: 'retrieve_text_chunks',
      description: `Retrieve relevant text chunks from the attached files. Available files right now: ${attachedFileNames.join(', ')}. Use this tool when you need exact passages from the files or want to inspect a specific topic inside the attachments. You can request up to ${VECTOR_SEARCH_LIMIT} chunks per call. Call it with a short, specific search string in the same language as the user.`,
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description:
              'A concise search string that captures the exact topic or passage you want to retrieve.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: VECTOR_SEARCH_LIMIT,
            description:
              'Optional number of chunks to return. Values outside the allowed range are clamped.',
          },
        },
        required: ['search'],
        additionalProperties: false,
      },
    });

    toolHandlers['retrieve_text_chunks'] = async (args) => {
      const search = typeof args.search === 'string' ? args.search : '';
      const requestedLimit =
        typeof args.limit === 'number' && Number.isFinite(args.limit)
          ? Math.trunc(args.limit)
          : VECTOR_SEARCH_LIMIT;
      const limit = Math.min(Math.max(requestedLimit, 1), VECTOR_SEARCH_LIMIT);
      const chunks = await retrieveChunksByQuery({
        searchQuery: search,
        federalStateId: user.federalState.id,
        relatedFileEntities,
        limit,
      });

      return formatRetrievedChunksForTool(chunks, attachedFileNames);
    };
  }

  return { tools, toolHandlers, webSearchResults };
}
