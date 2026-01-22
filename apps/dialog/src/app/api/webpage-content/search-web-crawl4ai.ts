import { WebsearchSource } from './types';
import { SINGLE_WEBSEARCH_CONTENT_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { defaultErrorSource } from '@/components/chat/sources/const';
import { getTranslations } from 'next-intl/server';
import { cacheLife } from 'next/cache';
import { logError, logWarning } from '@shared/logging';
import { env } from '@/env';
import { extractTitleFromMarkdown } from './utils';

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
    'og:title'?: string;
  };
  error_message?: string;
  status_code?: number;
}

interface Crawl4AIResponse {
  success: boolean;
  results: Crawl4AIResult[];
  error?: string;
}

/**
 * Scrapes web content using Crawl4AI and returns markdown content.
 * Uses the Crawl4AI docker container API to extract content.
 * @param url The URL to fetch and parse.
 * @returns The most important information from the page in markdown format.
 */
export async function webScraperCrawl4AI(url: string): Promise<WebsearchSource> {
  'use cache';
  cacheLife('weeks');

  const t = await getTranslations('websearch');

  try {
    const response = await fetch(`${env.crawl4AIUrl}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        crawler_config: {
          type: 'CrawlerRunConfig',
          params: {
            // cache_mode: 'enabled', // This parameter did not work, that's why we use next/cache
            word_count_threshold: 10, // Filter out tiny text blocks, e.g. buttons, labels
            remove_overlay_elements: true, // Remove popups
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
            markdown_generator: {
              type: 'DefaultMarkdownGenerator',
              params: {
                options: {
                  type: 'dict',
                  value: {
                    ignore_links: true,
                    ignore_images: true,
                    body_width: 0, // No automatic text wrapping
                  },
                },
              },
            },
          },
        },
      }),
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });

    if (!response.ok) {
      logError(
        `Crawl4AI request failed with status ${response.status} for URL: ${url}`,
        response.status,
      );
      return {
        ...defaultErrorSource({ status_code: response.status, t }),
        link: url,
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
      };
    }

    // Extract markdown content from the result object
    const markdownContent = result.markdown?.raw_markdown || '';

    if (!markdownContent) {
      logWarning(`Crawl4AI returned no markdown content for URL: ${url}`);
      return {
        ...defaultErrorSource({ status_code: 500, t }),
        link: url,
      };
    }

    const title =
      result.metadata?.title ||
      result.metadata?.['og:title'] ||
      extractTitleFromMarkdown(markdownContent) ||
      t('placeholders.unknown-title');

    // Trim content
    const trimmedContent = markdownContent
      .trim()
      .substring(0, SINGLE_WEBSEARCH_CONTENT_LENGTH_LIMIT);

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
      };
    }

    logError(`Crawl4AI request failed for URL: ${url}`, error);
    return {
      ...defaultErrorSource({ status_code: 500, t }),
      link: url,
    };
  }
}
