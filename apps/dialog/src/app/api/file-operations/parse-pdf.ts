import { extractText } from 'unpdf';
import { logError } from '@shared/logging';

/**
 * Extract text from PDF buffer with page-by-page breakdown using unpdf library
 * Returns an array of objects with page number and text content
 */
export async function extractTextFromPdfBuffer(
  pdfBuffer: Buffer,
): Promise<{ totalPages: number; text: string[] }> {
  try {
    // Convert Buffer to Uint8Array as required by unpdf
    const uint8Array = new Uint8Array(pdfBuffer);

    // Extract text without merging pages to get individual page content
    const { text, totalPages } = await extractText(uint8Array, { mergePages: false });

    // If text is a string array (one per page), map it to the expected format

    return {
      totalPages,
      text: text.map((pageText) => pageText.replace(/-\n/g, '').trim()),
    };
  } catch (error) {
    logError('Error parsing PDF with unpdf (pages)', error);
    throw new Error(
      `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
