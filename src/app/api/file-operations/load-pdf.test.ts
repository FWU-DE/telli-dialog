import { describe, it, expect, beforeAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { extractTextFromPdfBuffer } from './parse-pdf';

describe('extractTextFromPdfBuffer', () => {
  let pdfBuffer: Buffer;
  const fixturePath = path.resolve(__dirname, '../__fixtures__/Test Dokument.pdf');

  beforeAll(async () => {
    // Load the test PDF file once before all tests
    pdfBuffer = await fs.readFile(fixturePath);
  });

  it('should load the fixture file correctly', () => {
    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should extract text from a PDF buffer', async () => {
    // This test uses the actual PDF reader with the real file
    const text = await extractTextFromPdfBuffer(pdfBuffer);

    // Basic validations for the extracted text
    expect(text).toBeDefined();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);

    // Add assertions based on the expected content of your test document
    // For example:
    expect(text).toContain('Einige Beispielssätze');
  });
});
