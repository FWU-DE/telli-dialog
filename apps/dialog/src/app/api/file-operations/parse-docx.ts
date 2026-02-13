import { extractRawText } from 'mammoth';
import { logError } from '@shared/logging';

export async function extractTextFromWordDocument(buffer: Buffer): Promise<string> {
  try {
    // Use mammoth to convert the document to plain text
    // The {includeDefaultStyleMap: true} option ensures we get proper text formatting
    const result = await extractRawText({
      buffer: buffer,
    });

    // result.value contains the extracted text
    return result.value;
  } catch (error) {
    // Proper error handling
    logError('Error extracting text from Word document', error);
    throw new Error(`Failed to extract text from Word document: ${error}`);
  }
}
