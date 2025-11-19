import { WebsearchSource } from './types';
import { Readability } from '@mozilla/readability';
import { JSDOM, VirtualConsole } from 'jsdom';
import { CHAT_MESSAGE_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { defaultErrorSource } from '@/components/chat/sources/const';
import { getTranslations } from 'next-intl/server';
import he from 'he';
import { unstable_cacheLife as cacheLife } from 'next/cache';
import { logDebug, logError, logInfo, logWarning } from '@/utils/logging/logging';
import { isBinaryFile } from 'isbinaryfile';
import { useTranslations } from 'next-intl';

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
};

function getUnsupportedContentTypeError(t: ReturnType<typeof useTranslations>) {
  return {
    error: true,
    content: t('placeholders.not-supported-content'),
    name: t('placeholders.not-supported'),
    type: 'websearch',
  } as const;
}

/**
 * Checks if the URL is valid and then fetches the main content of the website.
 * Uses Mozilla's Readability to extract the main content.
 * Filters the most important information and stops if content is longer than TOKEN_LIMIT tokens.
 * @param url The URL to fetch and parse.
 * @param options The options for the fetch request.
 * @returns A summary of the most important information from the page.
 */
export async function webScraperExecutable(
  url: string,
  options: { timeout?: number } = { timeout: 5000 },
): Promise<WebsearchSource> {
  'use cache';
  cacheLife('weeks');

  logInfo(`Requesting webcontent for URL: ${url}`);
  const t = await getTranslations('websearch');
  let response: Response;
  try {
    const { isPage, redirectedUrl } = await isWebPage(url, options.timeout);
    if (!isPage) {
      logInfo(`URL is not a webpage: ${url}`);
      return {
        ...getUnsupportedContentTypeError(t),
        link: url,
      };
    }
    if (url !== redirectedUrl) {
      logDebug(`Requested URL '${url}' was redirected to '${redirectedUrl}'`);
    }
    // Set up a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    response = await fetch(redirectedUrl, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error) {
    logError(`Request timed out for URL: ${url}`, error);
    return {
      ...defaultErrorSource({ status_code: 408, t }),
      link: url,
      type: 'websearch',
    };
  }

  if (!response.ok) {
    return {
      ...defaultErrorSource({ status_code: response.status, t }),
      link: url,
      type: 'websearch',
    };
  }

  const buffer = Buffer.from(await response.clone().arrayBuffer());
  const isBinary = await isBinaryFile(buffer);
  if (isBinary) {
    logInfo(`Detected binary content for URL: ${url}`);
    return {
      ...getUnsupportedContentTypeError(t),
      link: url,
    };
  }

  // Extract title
  const html = await response.clone().text();
  // Extract title from meta tags or Open Graph tags first, as they're more reliable
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i);
  const metaTitleMatch = html.match(/<meta[^>]*name="title"[^>]*content="([^"]*)"/i);

  // Use the first available title source and decode HTML entities
  const rawTitle = ogTitleMatch?.[1]?.trim() || metaTitleMatch?.[1]?.trim() || 'Untitled Page';
  // decode html special characters like &amp; etc.
  const title = he.decode(rawTitle);

  let info = '';
  try {
    info = extractArticleContent(html, url);
  } catch (error) {
    logError(`Error in web parsing tool for URL: ${url}`, error);
    return {
      ...defaultErrorSource({ status_code: 408, t }),
      link: url,
      type: 'websearch',
    };
  }

  // Normalize and clean the content
  const normalizedInfo = info.normalize('NFKD').replace(/[^\x00-\x7F]/g, '');
  const trimmedInfo = normalizedInfo.substring(0, CHAT_MESSAGE_LENGTH_LIMIT);

  return {
    content: trimmedInfo,
    name: title,
    link: url,
    type: 'websearch',
  };
}

/**
 * Extract article content using Mozilla's Readability
 * @param {string} html - The HTML content of the page
 * @param {string} url - The URL of the article
 * @returns {string} - The extracted article content as text
 */
function extractArticleContent(html: string, url: string): string {
  let doc: JSDOM | undefined;
  const virtualConsole = new VirtualConsole();
  virtualConsole.forwardTo(console, {
    jsdomErrors: ['unhandled-exception', 'not-implemented'],
  });
  try {
    // Create a DOM document
    doc = new JSDOM(html, { url, virtualConsole });

    // Create a new Readability object and parse the document
    // Limit the max elements for performance reasons (Readability can take several minutes to parse large websites)
    const reader = new Readability(doc.window.document, { maxElemsToParse: 10_000 });
    const article = reader.parse();

    // Return the text content
    if (article?.textContent) {
      return article.textContent;
    } else if (!article) {
      logWarning(`Failed to parse article content using Readability for URL: ${url}`);
    } else {
      logWarning(`Failed to extract text content using Readability for URL: ${url}`);
    }
  } catch (error) {
    logError(`Error extracting content with Readability for URL: ${url}`, error);
  }

  // Fallback to basic title extraction if Readability fails
  try {
    doc ??= new JSDOM(html, { virtualConsole });
    const title = doc.window.document.querySelector('title')?.textContent || '';

    return `[Readability extraction failed] ${title}`;
  } catch {
    return `Failed to extract content from ${url}`;
  }
}

/**
 * The function sends a HEAD request to the URL and checks the Content-Type header.
 * @param url the URL to check
 * @param timeout the timeout for fetch request
 * @returns true if the content-type is text/html, false otherwise
 */
export async function isWebPage(url: string, timeout = 1000) {
  // Set up a timeout for the fetch request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, {
    headers,
    method: 'HEAD',
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  const contentType = response.headers.get('content-type');

  // Basic heuristic
  if (contentType?.includes('text/html')) {
    return {
      isPage: true, // it's a web page
      redirectedUrl: response.url,
    };
  }
  return {
    isPage: false, // likely a file
    redirectedUrl: response.url,
  };
}
