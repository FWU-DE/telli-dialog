import { extractText } from 'unpdf';
import { logError } from '@shared/logging';

/**
 * Extract text from PDF buffer using unpdf library
 * Returns the text content
 */
export async function extractTextFromPdfBuffer(
  pdfBuffer: Buffer,
): Promise<{ totalPages: number; text: string }> {
  try {
    // Convert Buffer to Uint8Array as required by unpdf
    const uint8Array = new Uint8Array(pdfBuffer);

    // Extract text
    const { text, totalPages } = await extractText(uint8Array, { mergePages: true });

    return {
      totalPages,
      text: text,
    };
  } catch (error) {
    logError('Error parsing PDF with unpdf', error);
    throw new Error(
      `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
