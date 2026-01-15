import { describe, expect, test, vi } from 'vitest';
import { webScraperCrawl4AI } from './search-web-crawl4ai';

const WIKI_PAGE_URL = 'https://de.wikipedia.org/wiki/Wiki';
const PDF_DOC_URL =
  'https://www.bpb.de/system/files/dokument_pdf/Zeitleiste_deutsch_zum-Selbstdruck_16_Einzelseiten.pdf';
const TOO_LARGE_PAGE_URL = 'https://openmoji.org/library/';
const PDF_DOC_WRONG_CONTENT_TYPE_URL =
  'https://www.wildtierportal-bw.de/filefly/api?action=download&path=%2Fjagd%2Fjagdzeitenbw2023.jpg';

// mock is needed because test is not running in a next.js environment
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}));
vi.mock('@shared/logging', () => ({
  env: {
    NEXT_PUBLIC_SENTRY_LOG_LEVEL: 'info',
  },
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

// We do not want to execute those tests on every run because they depend on external resources.
describe.skip('webScraperExecutable', () => {
  test('scrape existing wiki page', async () => {
    const output = await webScraperCrawl4AI(WIKI_PAGE_URL);
    expect(output).toMatchObject({
      link: WIKI_PAGE_URL,
      name: 'Wiki – Wikipedia',
      type: 'websearch',
    });
    expect(output?.content?.length).toBeGreaterThan(100);
  });

  test('scrape page should time out', async () => {
    const output = await webScraperCrawl4AI(WIKI_PAGE_URL, {
      timeout: 10,
    });
    expect(output).toMatchObject({
      error: true,
      link: WIKI_PAGE_URL,
    });
  });

  /*test('scrape pdf document', async () => {
    const output = await webScraperCrawl4AI(PDF_DOC_URL);
    expect(output).toMatchObject({
      error: true,
      link: PDF_DOC_URL,
    });
  });*/

  test('scrape pdf document with "Content-Type: text/html"', async () => {
    const output = await webScraperCrawl4AI(PDF_DOC_WRONG_CONTENT_TYPE_URL);
    expect(output).toMatchObject({
      error: true,
      link: PDF_DOC_WRONG_CONTENT_TYPE_URL,
    });
  });

  /*test('scrape large website should use fallback to title content', async () => {
    const output = await webScraperCrawl4AI(TOO_LARGE_PAGE_URL);
    expect(output).toStrictEqual({
      content: '[Readability extraction failed] Library  OpenMoji',
      link: TOO_LARGE_PAGE_URL,
      name: 'Library',
      type: 'websearch',
    });
  });*/
});
