import { describe, it, expect, beforeAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { extractTextFromPdfBuffer as extractTextFromPdfBufferAlt } from './parse-pdf';

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
});
