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

type WebScraperToolResult = {
  title: string | null;
  url: string | null;
  content: string | null;
  error: string | null;
};

type WebSearchToolResult = {
  title: string | null;
  url: string | null;
  content: string | null;
};

type WebSearchToolResponse = {
  results: WebSearchToolResult[];
  error: string | null;
};

type SemanticFileSearchChunkResult = {
  fileName: string | null;
  orderIndex: number | null;
  content: string | null;
};

type SemanticFileSearchToolResponse = {
  chunks: SemanticFileSearchChunkResult[];
  error: string | null;
};

function formatRetrievedChunksForTool(chunks: Awaited<ReturnType<typeof retrieveChunksByQuery>>) {
  const formattedChunks: SemanticFileSearchChunkResult[] = chunks.map((chunk) => ({
    fileName: chunk.fileName ?? null,
    orderIndex: chunk.orderIndex ?? null,
    content: chunk.content ?? null,
  }));

  const response: SemanticFileSearchToolResponse = {
    chunks: formattedChunks,
    error: null,
  };

  if (chunks.length === 0) {
    response.error = 'Keine passenden Textstellen gefunden.';
  }

  return JSON.stringify(response);
}

function formatWebScrapedContentForTool(result: WebSource) {
  const title = result.name?.trim() || null;
  const content = result.content?.trim() || null;

  const response: WebScraperToolResult = {
    title,
    url: result.link ?? null,
    content: null,
    error: null,
  };

  if (result.error) {
    response.error = 'Fehler beim Abrufen der Seite.';
    return JSON.stringify(response);
  }

  if (!content) {
    response.error = 'Keine verwertbaren Inhalte gefunden.';
    return JSON.stringify(response);
  }

  response.content = content;
  return JSON.stringify(response);
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
  learningScenarioId?: string;
  assistantId?: string;
  conversationId: string;
  relatedFileEntities: FileModelAndContent[];
  attachedLinks: string[];
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
  attachedLinks,
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

    tools.push({
      name: 'web_scraper',
      description:
        'Fetch and extract the main text from one specific URL. Use this tool when the user gives you a single webpage URL or when you can derive a concrete URL yourself, for example to scrape a documentation page or another known target. Use web_search instead when you need to discover relevant pages or compare multiple sources.' +
        (attachedLinks.length > 0
          ? `\n\nThe following URLs were pinned for this conversation and are likely relevant — consider scraping them when appropriate:\n${attachedLinks.map((link) => `- ${link}`).join('\n')}`
          : ''),
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

      return formatRetrievedChunksForTool(chunks);
    };
  }

  return { tools, toolHandlers, webSearchResults };
}
