import { cacheLife } from 'next/cache';
import { WebsearchSource } from './types';
import { webScraperCrawl4AI } from './search-web-crawl4ai';
import { webScraperReadability } from './search-web-readability';
import { logWarning } from '@shared/logging/logging';
import {
  incrementCrawl4aiSuccessCounter,
  incrementReadabilitySuccessCounter,
  incrementWebScraperFailedCounter,
} from '@shared/metrics/webScraperMeter';

/**
 * Scrapes web content and returns markdown.
 * @param url The URL to fetch and parse.
 * @returns The most important information from the page.
 */
export async function webScraper(url: string): Promise<WebsearchSource> {
  'use cache';
  cacheLife('weeks');

  // Try Crawl4AI first
  let result = await webScraperCrawl4AI(url);

  if (!result.error && result.content && result.content.length > 0) {
    incrementCrawl4aiSuccessCounter();
    return result;
  }

  // Fallback to Readability-based scraper
  logWarning(`Crawl4AI returned no result for URL: ${url}, fallback to Readability.`);
  result = await webScraperReadability(url);

  if (!result.error && result.content && result.content.length > 0) {
    incrementReadabilitySuccessCounter();
    return result;
  }

  // Both scrapers failed but we return the result anyway
  incrementWebScraperFailedCounter();
  return result;
}
