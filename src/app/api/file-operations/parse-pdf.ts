import { DataEntry, PdfReader } from 'pdfreader';

export async function extractTextFromPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  const reader = new PdfReader();

  let textContent: string = '';
  let lastItem: DataEntry | null = null;

  return new Promise<string>((resolve, reject) => {
    reader.parseBuffer(pdfBuffer, (err: Error | null, dataEntry: DataEntry | null) => {
      if (err) {
        reject(err);
        return;
      }

      if (!dataEntry) {
        // End of file, resolve the promise with the accumulated text
        resolve(textContent);
        return;
      }

      if (dataEntry.text) {
        // Check if this is a new line
        if (lastItem && lastItem.page !== dataEntry.page) {
          textContent += '\n';
        } else if (lastItem && lastItem.page === dataEntry.page) {
          // If on same line but different x position, add a space
          textContent += ' ';
        }

        textContent += dataEntry.text;
        lastItem = dataEntry;
      }
    });
  });
}
