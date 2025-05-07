import { env } from '@/env';
import { WebsearchSource } from './types';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { CHAT_MESSAGE_LENGTH_LIMIT } from '@/configuration-text-inputs/const';

type ToolResult = {
  content: string;
  result_type: ResultType;
  appendix?: string[];
  supplemental_code?: string;
};

enum ResultType {
  PLAIN = 'PLAIN',
  RESSOURCE = 'RESSOURCE',
}

type WebSearchResult = {
  title: string;
  url: string;
};

type BraveSearchResponse = {
  web: {
    results: WebSearchResult[];
  };
};

const MAXIMAL_CHARACTER_COUNT = 60_000;

export function parseHostname(uri: string) {
  return new URL(uri).hostname.replace(/^www\./, '');
}

export function constructBraveSummarySearchExec({
  nofSources,
  gptName,
}: {
  nofSources: number;
  gptName: string;
}) {
  return async function braveSummarySearchExecutable({ searchQuery }: { searchQuery: string }) {
    /**
     * Fetches the web search results, extracts the summary key, and then retrieves the summary.
     */
    const MAXIMAL_CHARACTER_ONE_PAGE = Math.floor(MAXIMAL_CHARACTER_COUNT / nofSources);

    try {
      const config = {
        brave_api_web_path: env.braveAPIWebPath,
        brave_api_headers: {
          web: {
            'X-Subscription-Token': env.braveAPIKey,
            'Api-Version': '2023-10-11',
          },
          summarizer: {
            'X-Subscription-Token': env.braveAPIKey,
            'Api-Version': '2024-04-23',
          },
        },
      };

      // Create URL with query parameters
      const url = new URL(env.braveAPIWebPath);
      url.searchParams.append('q', searchQuery);
      url.searchParams.append('country', 'DE');
      url.searchParams.append('search_lang', 'de');
      url.searchParams.append('safe_search', 'strict');
      url.searchParams.append('count', nofSources.toString());

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...config.brave_api_headers.web,
        },
        // Remove the body as GET requests shouldn't have a body
      });

      const status = response.status;
      const data = (await response.json()) as BraveSearchResponse;

      if (status !== 200) {
        console.error('Failure getting web search results \n%s', JSON.stringify(data, null, 2));
        throw new Error('Failure getting web search results');
      }

      const listOfResultObjects = data.web.results;
      let totalTokenCount = 0;
      let returnString = '## Internet-Suche durchgeführt\n\n';
      returnString += `Um die Anfrage zu beantworten, hat **${gptName}** eine Internetsuche durchgeführt. Die resultierenden Internetseiten:\n`;

      const listOfSources: WebsearchSource[] = [];

      // Create array of promises for web scraping
      const fetchWebContentTasks = listOfResultObjects.map((result) =>
        webScraperExecutable(result.url),
      );

      console.info('start fetching websites');
      const contents = await Promise.all(fetchWebContentTasks);
      console.info('finished fetching websites');

      for (let i = 0; i < listOfResultObjects.length; i++) {
        const result = listOfResultObjects[i];
        const webContent = contents[i];
        // TODO: double check whether this undefiend check makes sense
        if (webContent === undefined || result === undefined) {
          continue;
        }
        const textContent = webContent.content;

        let amountOfCharactersToUse: number;
        if (totalTokenCount + MAXIMAL_CHARACTER_ONE_PAGE >= MAXIMAL_CHARACTER_COUNT) {
          amountOfCharactersToUse = MAXIMAL_CHARACTER_COUNT - totalTokenCount;
        } else {
          amountOfCharactersToUse = MAXIMAL_CHARACTER_ONE_PAGE;
        }

        console.info(`amount of tokens to use: ${amountOfCharactersToUse}`);

        const websiteContent = `${textContent.substring(0, amountOfCharactersToUse)}\n\n`;
        const contentStr = `### Website Content:\n${websiteContent}`;
        returnString += contentStr;
        listOfSources.push({
          type: 'websearch',
          name: result.title,
          link: result.url,
          content: websiteContent,
        });

        totalTokenCount += contentStr.length;
        if (totalTokenCount >= MAXIMAL_CHARACTER_COUNT) {
          break;
        }
      }

      returnString += '---\n';

      // Using template literals instead of Template
      const searchInstruction =
        `**Anweisungen zur Antwort:**\n\n` +
        `$gptName schreibt eine genaue, detaillierte und umfassende Antwort auf die Benutzeranfrage.\n` +
        `Die Antwort sollte durch die bereitgestellten Suchergebnisse informiert sein.\n` +
        `1. $gptName schreibt URLs und Links NIEMALS aus, außer der Nutzer fragt explizit nach einem Link! Alle Informationen müssen mit einer Quellenangabe versehen werden.\n` +
        `2. Wenn $gptName die Antwort nicht kennt oder die Prämisse falsch ist, erklärt $gptName warum.\n` +
        `3. Wenn die Suchergebnisse leer oder nicht hilfreich sind, beantwortet $gptName die Anfrage bestmöglich mit vorhandenem Wissen.\n` +
        `4. Füge nach jeder aus der Suche gewonnenen Information stets Quellenangaben hinzu. Diese müssen in folgendem Format erscheinen: "Am Beispiel wurde festgestellt, dass die Ergebnisse signifikant waren.[3] Die weiteren Untersuchungen bestätigten diese Erkenntnisse.[1]". Es ist unerlässlich, dass die Quellen ausschließlich diesem Format folgen [d+] und niemals so: [Quelle: 5].` +
        `$gptName DARF NIEMALS MORALISIEREN ODER ABSCHWÄCHENDE SPRACHE VERWENDEN. $gptName VERMEIDET folgende Formulierungen:\n` +
        `"Es ist wichtig zu ..."\n` +
        `"Es ist unangemessen ..."\n` +
        `"Es ist subjektiv ..."\n`;

      returnString += searchInstruction;
      console.info(`SOURCES: ${listOfSources}`);
      const sources: Record<number, WebsearchSource> = {};
      listOfSources.forEach((source, index) => {
        sources[index + 1] = source;
      });

      return {
        content: returnString,
        sources: sources,
      };
    } catch (error) {
      console.error('Error in brave search:', error);
      return {
        content: 'Fehler bei der Ausführung, versuche es später nochmal.',
        sources: {},
      };
    }
  };
}

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
export async function webScraperExecutable(url: string): Promise<WebsearchSource> {
  let hostname = '';
  const errorName = 'Inhalt nicht verfügbar';
  const errorContent = `Du hast versucht die Seite zu laden, aber es ist ein Fehler aufgetreten. Nenne keinen Fehlercode und gib folgende Hinweise an den Nutzer weiter: Bitte stelle sicher, dass:
- die Seite öffentlich zugänglich ist
- keine Anmeldung erforderlich ist
- es sich um eine gültige URL handelt`;
  try {
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
    } catch (error) {
      console.error(`Request timed out for URL: ${url}`);
      return { content: 'Kein Inhalt gefunden', type: 'websearch', name: '', link: '', hostname };
    }

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return {
        content: `${errorContent} Status Code: ${response.status}`,
        type: 'websearch',
        name: errorName,
        link: '',
        hostname,
      };
    }

    const responseClone = response.clone();

    // Extract title
    const html = await responseClone.text();
    // Extract title from meta tags or Open Graph tags first, as they're more reliable
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i);
    const metaTitleMatch = html.match(/<meta[^>]*name="title"[^>]*content="([^"]*)"/i);
    // Extract domain from URL
    const domain = parseHostname(url);
    // Use the first available title source
    let title = 'Untitled Page';
    title = ogTitleMatch?.[1]?.trim() || metaTitleMatch?.[1]?.trim() || 'Untitled Page';

    let info = '';
    try {
      info = extractArticleContent(html, url);
    } catch (error) {
      console.error('Error in web parsing tool:', error);
      return {
        content: 'Fehler beim Laden der Seite',
        type: 'websearch',
        name: 'Inhalt nicht verfügbar',
        link: '',
        hostname,
      };
    }

    // Normalize and clean the content
    // eslint-disable-next-line no-control-regex
    const normalizedInfo = info.normalize('NFKD').replace(/[^\x00-\x7F]/g, '');
    const trimmedInfo = normalizedInfo.substring(0, CHAT_MESSAGE_LENGTH_LIMIT);
    console.log(title);
    return { content: trimmedInfo, type: 'websearch', name: title, link: url, hostname };
  } catch (error) {
    console.error('Error in web parsing tool:', error);
    return {
      content: 'Fehler beim Laden der Seite',
      type: 'websearch',
      name: 'Inhalt nicht verfügbar',
      link: '',
      hostname,
    };
  }
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
