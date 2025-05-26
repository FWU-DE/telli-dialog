import { describe, it, expect, beforeAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  createPageToChapterMapping,
  extractTextFromPdfBuffer as extractTextFromPdfBufferAlt,
  extractTOC,
} from './parse-pdf';

const COMPLEX_PDF_PATH = path.resolve(__dirname, '../__fixtures__/Bundestag-KI.pdf');
const SIMPLE_PDF_PATH = path.resolve(__dirname, '../__fixtures__/Test Dokument.pdf');

describe('extractTextFromPdfBuffer', () => {
  let pdfBuffer: Buffer;

  beforeAll(async () => {
    // Load the test PDF file once before all tests
    pdfBuffer = await fs.readFile(SIMPLE_PDF_PATH);
  });

  it('should load the fixture file correctly', () => {
    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should extract text from a PDF buffer', async () => {
    // This test uses the actual PDF reader with the real file
    const { pageElement, totalPages } = await extractTextFromPdfBufferAlt(pdfBuffer);

    // Basic validations for the extracted text
    expect(pageElement).toBeDefined();
    expect(totalPages).toBe(1);
    expect(typeof pageElement?.[0]?.text).toBe('string');
    expect(pageElement?.[0]?.text.length).toBeGreaterThan(0);

    // Add assertions based on the expected content of your test document
    // For example:
    expect(pageElement?.[0]?.text).toContain('Einige Beispielssätze');
  });
});

describe('extractTextFromPdfBufferAlt', () => {
  let pdfBuffer: Buffer;

  beforeAll(async () => {
    pdfBuffer = await fs.readFile(COMPLEX_PDF_PATH);
  });

  it('should extract text from a PDF buffer', async () => {
    const { pageElement, totalPages } = await extractTextFromPdfBufferAlt(pdfBuffer);

    expect(pageElement).toBeDefined();
    expect(totalPages).toBe(26);
    expect(typeof pageElement?.[0]?.text).toBe('string');
    expect(pageElement?.[0]?.text.length).toBeGreaterThan(0);
  });

  it('should extract the table of contents from a PDF buffer', async () => {
    const extractedTOC = await extractTOC(pdfBuffer);
    expect(extractedTOC).toBeDefined();
    expect(extractedTOC.length).toBe(22);
    expect(extractedTOC?.[1]?.title).toBe('1. Vorbemerkung');
    expect(extractedTOC?.[1]?.fullPath).toBe('1. Vorbemerkung');
    expect(extractedTOC?.[2]?.title).toBe(
      '2. Rechtliche Vorgaben zum Einsatz von KI in der Bildung',
    );
    expect(extractedTOC?.[2]?.fullPath).toBe(
      '2. Rechtliche Vorgaben zum Einsatz von KI in der Bildung',
    );
    expect(extractedTOC?.[3]?.title).toBe('2.1. Europäische Ebene');
    expect(extractedTOC?.[3]?.fullPath).toBe(
      '2. Rechtliche Vorgaben zum Einsatz von KI in der Bildung / 2.1. Europäische Ebene',
    );
  });

  it('should create a page to chapter mapping from a PDF buffer', async () => {
    const extractedTOC = await extractTOC(pdfBuffer);
    const pageToChapterMapping = await createPageToChapterMapping(extractedTOC, 24);
    expect(pageToChapterMapping).toBeDefined();
    expect(Object.keys(pageToChapterMapping).length).toBe(24);
    // pages 1 and 2 have no chapter and page 3 is the table of contents itself
    expect(pageToChapterMapping[4]).toBe('1. Vorbemerkung'); // the chapter of page 4 is "1. Vorbemerkung"
    expect(pageToChapterMapping[6]).toBe(
      '2. Rechtliche Vorgaben zum Einsatz von KI in der Bildung / 2.1. Europäische Ebene',
    );
    expect(pageToChapterMapping[7]).toBe(
      '2. Rechtliche Vorgaben zum Einsatz von KI in der Bildung / 2.1. Europäische Ebene',
    );
  });
});
