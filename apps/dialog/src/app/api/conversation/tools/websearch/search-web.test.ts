import { describe, expect, test, vi } from 'vitest';
import { isWebPage, webScraperExecutable } from './search-web';

const WIKI_PAGE_URL = 'https://de.wikipedia.org/wiki/Wiki';
const PDF_DOC_URL =
  'https://www.bpb.de/system/files/dokument_pdf/Zeitleiste_deutsch_zum-Selbstdruck_16_Einzelseiten.pdf';
const REDIRECT_PAGE_URL = 'https://de.wikipedia.org/';
const TOO_LARGE_PAGE_URL = 'https://openmoji.org/library/';

// mock is needed because test is not running in a next.js environment
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}));
vi.mock('@/utils/logging/logging', () => ({
  env: {
    NEXT_PUBLIC_SENTRY_LOG_LEVEL: 'info',
  },
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

// We do not want to execute those tests on every run because they depend on external resources.
describe.skip('webScraperExecutable', () => {
  test('scrape existing wiki page', async () => {
    const output = await webScraperExecutable(WIKI_PAGE_URL);
    expect(output).toMatchObject({
      link: WIKI_PAGE_URL,
      name: 'Wiki – Wikipedia',
      type: 'websearch',
    });
    expect(output?.content?.length).toBeGreaterThan(100);
  });

  test('scrape page should time out', async () => {
    const output = await webScraperExecutable(WIKI_PAGE_URL, {
      timeout: 10,
    });
    expect(output).toMatchObject({
      error: true,
      link: WIKI_PAGE_URL,
    });
  });

  test('scrape pdf document', async () => {
    const output = await webScraperExecutable(PDF_DOC_URL);
    expect(output).toMatchObject({
      error: true,
      link: PDF_DOC_URL,
    });
  });

  test('scrape large website should use fallback to title content', async () => {
    const output = await webScraperExecutable(TOO_LARGE_PAGE_URL);
    expect(output).toStrictEqual({
      content: '[Readability extraction failed] Library  OpenMoji',
      link: TOO_LARGE_PAGE_URL,
      name: 'Library',
      type: 'websearch',
    });
  });

  test('isWebPage returns true for wiki page', async () => {
    const { isPage } = await isWebPage(WIKI_PAGE_URL);
    expect(isPage).toBe(true);
  });

  test('isWebPage returns false for pdf document', async () => {
    const { isPage } = await isWebPage(PDF_DOC_URL);
    expect(isPage).toBe(false);
  });

  test('isWebPage returns redirected url', async () => {
    const { redirectedUrl } = await isWebPage(REDIRECT_PAGE_URL);
    expect(redirectedUrl).not.toBe(REDIRECT_PAGE_URL);
  });
});
