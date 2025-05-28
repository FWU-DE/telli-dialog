import { parseOfficeAsync } from 'officeparser';

export async function extractTextFromPowerPointDocument(buffer: Buffer): Promise<string> {
  try {
    // Use officeparser to extract text from the PowerPoint buffer
    const result = parseOfficeAsync(
      buffer,
      {
        // Configure to ignore notes for cleaner text extraction
        ignoreNotes: true,
        // Use space as newline delimiter for better readability
        newlineDelimiter: '\n',
        // Don't output errors to console
        outputErrorToConsole: false,
        putNotesAtLast: true,
      },
    );

    // Return the extracted text
    return result;
  } catch (error) {
    // Proper error handling
    console.error('Error extracting text from PowerPoint document:', error);
    throw new Error(`Failed to extract text from PowerPoint document: ${error}`);
  }
}
