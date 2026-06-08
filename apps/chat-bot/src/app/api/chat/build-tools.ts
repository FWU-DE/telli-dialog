import type { ToolDefinition } from '@ais-chat/ai-core';
import { UserAndContext } from '@/auth/types';
import { isWebSearchEnabled, searchWeb } from './websearch';
import type { ToolHandler } from './agent-loop';
import type { WebSearchResult } from '@shared/db/schema';
import type { FileModelAndContent } from '@shared/db/schema';
import type { WebSource } from '@shared/db/types';
import { VECTOR_SEARCH_LIMIT } from '@/configuration-text-inputs/const';
import { retrieveChunksByQuery } from '../rag/rag-service';
import { webScraper } from '../web-scraper/web-scraper';
import { isIP } from 'node:net';

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

function formatWebScrapedContentForTool(result: WebSource) {
  const title = result.name?.trim() || 'Unbekannter Titel';
  const content = result.content?.trim();

  if (result.error) {
    return `Titel: ${title}\nURL: ${result.link}\n\nFehler beim Abrufen der Seite.`;
  }

  if (!content) {
    return `Titel: ${title}\nURL: ${result.link}\n\nKeine verwertbaren Inhalte gefunden.`;
  }

  return `Titel: ${title}\nURL: ${result.link}\n\n${content}`;
}

function validateWebScraperUrl(inputUrl: string): { url: string; error?: string } {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(inputUrl);
  } catch {
    return { url: '', error: 'Error: Invalid URL.' };
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { url: '', error: 'Error: Only http and https URLs are allowed.' };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    isIP(hostname) !== 0
  ) {
    return { url: '', error: 'Error: Only domain hosts are allowed.' };
  }

  return { url: parsedUrl.toString() };
}

type BuildToolsParams = {
  user: UserAndContext;
  characterId?: string;
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
  assistantId,
  conversationId,
  relatedFileEntities,
  onWebSearchResults,
}: BuildToolsParams): Promise<BuildToolsResult> {
  const tools: ToolDefinition[] = [];
  const toolHandlers: Record<string, ToolHandler> = {};
  const webSearchResults: WebSearchResult[] = [];
  const attachedFileNames = relatedFileEntities.map((file) => file.name);

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

    tools.push({
      name: 'web_scraper',
      description:
        'Fetch and extract the main text from one specific URL. Use this tool when the user gives you a single webpage URL and you need its content. Use web_search instead when you need to discover relevant pages or compare multiple sources.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description:
              'The exact URL of the page to scrape. It must be a single http or https URL. Only domain hosts are allowed (no localhost, .local, or IP addresses).',
          },
        },
        required: ['url'],
        additionalProperties: false,
      },
    });

    toolHandlers['web_scraper'] = async (args) => {
      const url = typeof args.url === 'string' ? args.url.trim() : '';

      if (url.length === 0) {
        return 'Error: Missing URL.';
      }

      const validationResult = validateWebScraperUrl(url);

      if (validationResult.error) {
        return validationResult.error;
      }

      const result = await webScraper(validationResult.url);
      return formatWebScrapedContentForTool(result);
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
