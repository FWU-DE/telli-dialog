import { WebsearchSource } from './types';
import { Readability } from '@mozilla/readability';
import { JSDOM, VirtualConsole } from 'jsdom';
import { SINGLE_WEBSEARCH_CONTENT_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { defaultErrorSource } from '@/components/chat/sources/const';
import { getTranslations } from 'next-intl/server';
import he from 'he';
import { logDebug, logError, logInfo, logWarning } from '@shared/logging';
import { isBinaryFile } from 'isbinaryfile';

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
};

/**
 * Checks if the URL is valid and then fetches the main content of the website.
 * Uses Mozilla's Readability to extract the main content.
 * @param url The URL to fetch and parse.
 * @returns A summary of the most important information from the page.
 */
export async function webScraperReadability(url: string): Promise<WebsearchSource> {
  const t = await getTranslations('websearch');
  let response: Response;

  try {
    const { isPage, redirectedUrl } = await isWebPage(url, 5000); // 5 seconds timeout

    if (!isPage) {
      logInfo(`URL is not a webpage: ${url}`);
      return {
        ...defaultErrorSource(),
        link: url,
      };
    }

    if (url !== redirectedUrl) {
      logDebug(`Requested URL '${url}' was redirected to '${redirectedUrl}'`);
    }

    response = await fetch(redirectedUrl, {
      headers,
      signal: AbortSignal.timeout(5000), // 5 seconds timeout
    });
  } catch (error) {
    logError(`Request timed out for URL: ${url}`, error);
    return {
      ...defaultErrorSource(),
      link: url,
    };
  }

  if (!response.ok) {
    return {
      ...defaultErrorSource(),
      link: url,
    };
  }

  const buffer = Buffer.from(await response.clone().arrayBuffer());
  const isBinary = await isBinaryFile(buffer);
  if (isBinary) {
    logInfo(`Detected binary content for URL: ${url}`);
    return {
      ...defaultErrorSource(),
      link: url,
    };
  }

  // Extract title
  const html = await response.clone().text();
  // Extract title from meta tags or Open Graph tags first, as they're more reliable
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i);
  const metaTitleMatch = html.match(/<meta[^>]*name="title"[^>]*content="([^"]*)"/i);

  // Use the first available title source
  const rawTitle =
    ogTitleMatch?.[1]?.trim() || metaTitleMatch?.[1]?.trim() || t('placeholders.unknown-title');
  // decode html special characters like &amp; etc.
  const title = he.decode(rawTitle);

  let info = '';
  try {
    info = extractArticleContent(html, url);
  } catch (error) {
    logError(`Error in web parsing tool for URL: ${url}`, error);
    return {
      ...defaultErrorSource(),
      link: url,
    };
  }

  // Normalize and clean the content (reduce all whitespace to single spaces)
  const normalizedInfo = info.normalize('NFC').trim().replace(/\s+/g, ' ');
  const trimmedInfo = normalizedInfo.substring(0, SINGLE_WEBSEARCH_CONTENT_LENGTH_LIMIT);

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
  // For JSDOM v27: use forwardTo, to log jsdom errors on the console
  // virtualConsole.forwardTo(console, {
  //   jsdomErrors: ['unhandled-exception', 'not-implemented'],
  // });
  try {
    doc = new JSDOM(html, { url, virtualConsole });

    // Limit the max elements for performance reasons (Readability can take several minutes to parse large websites)
    const reader = new Readability(doc.window.document, { maxElemsToParse: 10_000 });
    const article = reader.parse();

    if (article?.textContent) {
      return article.textContent;
    } else {
      logWarning(`Failed to extract text content using Readability for URL: ${url}`);
      return '';
    }
  } catch (error) {
    logError(`Error extracting content with Readability for URL: ${url}`, error);
    return '';
  }
}

/**
 * The function sends a HEAD request to the URL and checks the Content-Type header.
 * @param url the URL to check
 * @param timeout the timeout for fetch request
 * @returns true if the content-type is text/html, false otherwise
 */
export async function isWebPage(url: string, timeout: number) {
  const response = await fetch(url, {
    headers,
    method: 'HEAD',
    signal: AbortSignal.timeout(timeout),
  });

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
