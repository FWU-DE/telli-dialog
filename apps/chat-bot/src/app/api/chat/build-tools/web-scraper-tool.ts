import type { ToolDefinition } from '@ais-chat/ai-core';
import type { WebSource } from '@shared/db/types';
import { isIP } from 'node:net';
import { webScraper } from '../../web-scraper/web-scraper';
import type { ToolHandler } from './types';

type WebScraperToolResult = {
  title: string | null;
  url: string | null;
  content: string | null;
  error: string | null;
};

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

type CreateWebScraperToolParams = {
  attachedSourceUrls: string[];
};

export function createWebScraperTool({ attachedSourceUrls }: CreateWebScraperToolParams): {
  definition: ToolDefinition;
  handler: ToolHandler;
} {
  const definition: ToolDefinition = {
    name: 'web_scraper',
    description:
      'Fetch and extract the main text from one specific URL. Use this tool when the user gives you a single webpage URL or when you can derive a concrete URL yourself, for example to scrape a documentation page or another known target. Use web_search instead when you need to discover relevant pages or compare multiple sources.' +
      (attachedSourceUrls.length > 0
        ? `\n\nThe following URLs were pinned for this conversation and are likely relevant — consider scraping them when appropriate:\n${attachedSourceUrls.map((link) => `- ${link}`).join('\n')}`
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
  };

  const handler: ToolHandler = async (args) => {
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

  return {
    definition,
    handler,
  };
}
