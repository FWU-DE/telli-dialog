import { parseOfficeAsync } from 'officeparser';

export async function extractTextFromWordDocument(buffer: Buffer): Promise<string> {
  try {
    // Use officeparser to extract text from the document buffer
    // parseOfficeAsync supports file buffers and returns a promise with the extracted text
    const extractedText = await parseOfficeAsync(buffer, {
      ignoreNotes: true,
      newlineDelimiter: '\n',
      outputErrorToConsole: false,
      putNotesAtLast: true,
    });

    // Return the extracted text
    return extractedText;
  } catch (error) {
    // Proper error handling
    console.error('Error extracting text from Word document:', error);
    throw new Error(`Failed to extract text from Word document: ${error}`);
  }
}
