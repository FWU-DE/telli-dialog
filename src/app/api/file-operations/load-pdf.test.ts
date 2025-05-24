import { describe, it, expect, beforeAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { extractTextFromPdfBuffer, extractTextFromPdfBufferWithPdf2json } from './parse-pdf';

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
    const extractedPages = await extractTextFromPdfBufferWithPdf2json(pdfBuffer);

    // Basic validations for the extracted text
    expect(extractedPages).toBeDefined();
    expect(extractedPages.length).toBe(1);
    expect(typeof extractedPages?.[0]?.text).toBe('string');
    expect(extractedPages?.[0]?.text.length).toBeGreaterThan(0);

    // Add assertions based on the expected content of your test document
    // For example:
    expect(extractedPages?.[0]?.text).toContain('Einige Beispielssätze');
  });
});
