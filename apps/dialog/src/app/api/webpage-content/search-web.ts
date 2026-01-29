import { cacheLife } from 'next/cache';
import { webScraperCrawl4AI } from './search-web-crawl4ai';
import { webScraperReadability } from './search-web-readability';
import { logWarning } from '@shared/logging/logging';
import { WebsearchSource } from '@shared/db/types';

/**
 * Scrapes web content and returns markdown.
 * @param url The URL to fetch and parse.
 * @returns The most important information from the page.
 */
export async function webScraper(url: string): Promise<WebsearchSource> {
  'use cache';
  cacheLife('weeks');

  // Try Crawl4AI first
  const result = await webScraperCrawl4AI(url);

  if (!result.error && result.content && result.content.length > 0) {
    return result;
  }

  // Fallback to Readability-based scraper
  logWarning(`Crawl4AI returned no result for URL: ${url}, fallback to Readability.`);
  return webScraperReadability(url);
}
