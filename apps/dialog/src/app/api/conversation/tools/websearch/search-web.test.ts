import { describe, expect, test, vi } from 'vitest';
import { isWebPage, webScraperExecutable } from './search-web';

const WIKI_PAGE_URL = 'https://de.wikipedia.org/wiki/Wiki';
const PDF_DOC_URL =
  'https://www.bpb.de/system/files/dokument_pdf/Zeitleiste_deutsch_zum-Selbstdruck_16_Einzelseiten.pdf';

// mock is needed because test is not running in a next.js environment
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}));

// We do not want to execute those tests on every run because they depend on external resources.
// That is why we use describe.only to run them only when explicitly requested.
describe.only('webScraperExecutable', () => {
  test('scrape existing wiki page', { timeout: 1000 }, async () => {
    const output = await webScraperExecutable(WIKI_PAGE_URL);
    expect(output).toBeDefined();
    expect(output.content?.length).toBeGreaterThan(100);
    expect(output.name).toBe('Wiki – Wikipedia');
    expect(output.link).toBe(WIKI_PAGE_URL);
    expect(output.type).toBe('websearch');
  });

  test('scrape page should time out', async () => {
    const output = await webScraperExecutable(WIKI_PAGE_URL, {
      timeout: 10,
    });
    expect(output).toBeDefined();
    expect(output.error).toBe(true);
    expect(output.link).toBe(WIKI_PAGE_URL);
  });

  test('scrape pdf document', async () => {
    const output = await webScraperExecutable(PDF_DOC_URL);
    expect(output).toBeDefined();
    expect(output.error).toBe(true);
    expect(output.link).toBe(PDF_DOC_URL);
  });

  test('isWebPage returns true for wiki page', async () => {
    const output = await isWebPage(WIKI_PAGE_URL);
    expect(output).toBe(true);
  });

  test('isWebPage returns false for pdf document', async () => {
    const output = await isWebPage(PDF_DOC_URL);
    expect(output).toBe(false);
  });
});
