import { WebsearchSource } from './types';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { CHAT_MESSAGE_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { parseHostname } from '@/utils/web-search/parsing';
import { defaultErrorSource } from '@/components/chat/sources/const';

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
};

/**
 * Checks if the URL is valid and then fetches the main content of the website.
 * Uses Mozilla's Readability to extract the main content.
 * Filters the most important information and stops if content is longer than TOKEN_LIMIT tokens.
 * @param url The URL to fetch and parse.
 * @returns A summary of the most important information from the page.
 */
export async function webScraperExecutable(
  url: string,
): Promise<{ result: WebsearchSource; error: Error | null }> {
  let hostname = '';

  hostname = parseHostname(url);
  console.info(`Requesting webcontent for url: ${url}`);
  let response: Response;
  try {
    // Set up a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
    response = await fetch(url, {
      headers: headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch {
    console.error(`Request timed out for URL: ${url}`);
    return {
      result: { ...defaultErrorSource, link: url, hostname },
      error: new Error(`Request timed out for URL: ${url}`),
    };
  }

  if (!response.ok) {
    return {
      result: { ...defaultErrorSource, link: url, hostname },
      error: new Error(`HTTP error! status: ${response.status}`),
    };
  }

  const responseClone = response.clone();

  // Extract title
  const html = await responseClone.text();
  // Extract title from meta tags or Open Graph tags first, as they're more reliable
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i);
  const metaTitleMatch = html.match(/<meta[^>]*name="title"[^>]*content="([^"]*)"/i);
  // Use the first available title source
  let title = 'Untitled Page';
  title = ogTitleMatch?.[1]?.trim() || metaTitleMatch?.[1]?.trim() || 'Untitled Page';

  let info = '';
  try {
    info = extractArticleContent(html, url);
  } catch {
    console.error('Error in web parsing tool');
    return {
      result: { ...defaultErrorSource, link: url, hostname },
      error: new Error('Fehler beim Laden der Seite'),
    };
  }

  // Normalize and clean the content
  const normalizedInfo = info.normalize('NFKD').replace(/[^\x00-\x7F]/g, '');
  const trimmedInfo = normalizedInfo.substring(0, CHAT_MESSAGE_LENGTH_LIMIT);
  console.log(title);
  return {
    result: { content: trimmedInfo, name: title, link: url, hostname, type: 'websearch' },
    error: null,
  };
}

/**
 * Extract article content using Mozilla's Readability
 * @param {string} html - The HTML content of the page
 * @param {string} url - The URL of the article
 * @returns {string} - The extracted article content as text
 */
function extractArticleContent(html: string, url: string): string {
  try {
    // Create a DOM document
    const doc = new JSDOM(html, { url: url });

    // Check if Readability is available
    if (!Readability) {
      throw new Error('Readability is not available');
    }

    // Create a new Readability object and parse the document
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Failed to parse article content');
    }
    if (!article.textContent) {
      throw new Error('Failed to extract content');
    }

    // Return the text content
    return article.textContent;
  } catch (error) {
    console.error('Error extracting content with Readability:', error);

    // Fallback to basic title extraction if Readability fails
    try {
      const dom = new JSDOM(html);
      const title = dom.window.document.querySelector('title')?.textContent || '';

      return `[Readability extraction failed] ${title}`;
    } catch {
      return `Failed to extract content from ${url}`;
    }
  }
}
