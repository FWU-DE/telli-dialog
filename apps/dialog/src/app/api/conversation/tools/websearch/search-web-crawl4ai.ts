import { WebsearchSource } from './types';
import { SINGLE_WEBSEARCH_CONTENT_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { defaultErrorSource } from '@/components/chat/sources/const';
import { getTranslations } from 'next-intl/server';
import { cacheLife } from 'next/cache';
import { logError, logInfo, logWarning } from '@shared/logging';
import { useTranslations } from 'next-intl';
import { env } from '@/env';

interface Crawl4AIResult {
  url: string;
  html: string;
  success: boolean;
  markdown?: {
    raw_markdown?: string;
    fit_markdown?: string;
  };
  metadata?: {
    title?: string;
    description?: string;
  };
  error_message?: string;
  status_code?: number;
}

interface Crawl4AIResponse {
  success: boolean;
  results: Crawl4AIResult[];
  error?: string;
}

function getUnsupportedContentTypeError(t: ReturnType<typeof useTranslations>) {
  return {
    error: true,
    content: t('placeholders.not-supported-content'),
    name: t('placeholders.not-supported'),
    type: 'websearch',
  } as const;
}

/**
 * Scrapes web content using Crawl4AI and returns markdown content.
 * Uses the Crawl4AI docker container API to extract content.
 * @param url The URL to fetch and parse.
 * @param options The options for the fetch request.
 * @returns A summary of the most important information from the page in markdown format.
 */
export async function webScraperCrawl4AI(
  url: string,
  options: { timeout: number } = { timeout: 30000 },
): Promise<WebsearchSource> {
  'use cache';
  cacheLife('weeks');

  logInfo(`Requesting webcontent via Crawl4AI for URL: ${url}`);
  const t = await getTranslations('websearch');

  try {
    const response = await fetch(`${env.crawl4AIUrl}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        //cache_mode: 'ENABLED',
        //content_filter: 'pruning',
        crawler_config: {
          excluded_tags: [
            'nav',
            'header',
            'footer',
            'aside',
            'form',
            'button',
            'iframe',
            'script',
            'style',
            'svg',
            'noscript',
            'label',
          ], // Delete tags that usually don't contain main content
          exclude_external_links: true,
          exclude_social_media_links: true,
          exclude_all_images: true,
          markdown_generator_config: {
            options: {
              ignore_links: true,
              ignore_images: true,
              skip_internal_links: true,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(options.timeout),
    });

    if (!response.ok) {
      logError(
        `Crawl4AI request failed with status ${response.status} for URL: ${url}`,
        response.status,
      );
      return {
        ...defaultErrorSource({ status_code: response.status, t }),
        link: url,
        type: 'websearch',
      };
    }

    const data = (await response.json()) as Crawl4AIResponse;
    const result = data.results?.[0];

    if (!data.success || !result || !result.success) {
      logWarning(
        `Crawl4AI returned no result for URL: ${url}, error: ${data.error ?? result?.error_message}`,
      );
      return {
        ...defaultErrorSource({ status_code: result?.status_code ?? 500, t }),
        link: url,
        type: 'websearch',
      };
    }

    // Extract markdown content from the result object
    let markdownContent = result.markdown?.raw_markdown || '';

    // Remove markdown links, keeping only the link text: [text](url) -> text
    markdownContent = markdownContent.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1').trim();

    if (!markdownContent) {
      logWarning(`Crawl4AI returned no markdown content for URL: ${url}`);
      return {
        ...getUnsupportedContentTypeError(t),
        link: url,
      };
    }

    // Extract title from metadata or fallback
    const title = result.metadata?.title ?? 'Untitled Page';

    // Trim content
    const trimmedContent = markdownContent.substring(0, SINGLE_WEBSEARCH_CONTENT_LENGTH_LIMIT);

    return {
      content: trimmedContent,
      name: title,
      link: url,
      type: 'websearch',
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logError(`Crawl4AI request timed out for URL: ${url}`, error);
      return {
        ...defaultErrorSource({ status_code: 408, t }),
        link: url,
        type: 'websearch',
      };
    }

    logError(`Crawl4AI request failed for URL: ${url}`, error);
    return {
      ...defaultErrorSource({ status_code: 500, t }),
      link: url,
      type: 'websearch',
    };
  }
}
