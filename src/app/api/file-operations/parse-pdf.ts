import { PdfReader } from 'pdfreader';

export async function extractTextFromPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  const reader = new PdfReader();

  let textContent: string = '';
  let lastItem: TextItem | null = null;

  return new Promise<string>((resolve, reject) => {
    reader.parseBuffer(pdfBuffer, (err: Error | null, item: TextItem | null) => {
      if (err) {
        reject(err);
        return;
      }

      if (!item) {
        // End of file, resolve the promise with the accumulated text
        resolve(textContent);
        return;
      }

      if (item.text) {
        // Check if this is a new line
        if (lastItem && lastItem.y !== item.y) {
          textContent += '\n';
        } else if (lastItem && lastItem.x !== item.x) {
          // If on same line but different x position, add a space
          textContent += ' ';
        }

        textContent += item.text;
        lastItem = item;
      }
    });
  });
}
