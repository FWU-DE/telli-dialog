import { DataEntry, PdfReader } from 'pdfreader';
import PDFParser, { Output } from 'pdf2json';
import { Text } from 'pdf2json';


function removeRepetitiveCharacters(text: string, character: string): string {
  while (text.includes(character + character)) {
    text = text.replace(character + character, character);
  }
  return text;
}
function parsePdfData(pdfData: Output) {
  const pages: { page: number; text: string }[] = [];

  for (const [pageIndex, page] of pdfData.Pages.entries()) {
    let pageText = '';

    if (!page.Texts || !Array.isArray(page.Texts)) {
      continue;
    }
    pageText = parseTextElementWithHeuristics(page.Texts);

    pageText = removeRepetitiveCharacters(pageText, '\n');
    pageText = removeRepetitiveCharacters(pageText, ' ');
    pageText = pageText.trim();

    pages.push({
      page: pageIndex + 1,
      text: pageText,
    });
  }
  return pages;
}

export async function extractTextFromPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  const reader = new PdfReader();

  let textContent: string = '';
  let lastItem: DataEntry | null = null;

  return new Promise<string>((resolve, reject) => {
    reader.parseBuffer(pdfBuffer, (err: string | null, dataEntry: DataEntry | null) => {
      if (err != null) {
        console.error('Error parsing PDF:', err);
        reject(new Error(err));
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
/**
 * Alternative implementation using pdf2json library
 * This version leverages pdf2json's built-in text extraction capabilities
 */
export async function extractTextFromPdfBufferWithPdf2json(
  pdfBuffer: Buffer,
): Promise<{ page: number; text: string }[]> {
  const pdfParser = new PDFParser();
  
  return new Promise((resolve, reject) => {
    // Set up error handler
    pdfParser.on('pdfParser_dataError', (errData) => {
      console.error('Error parsing PDF with pdf2json:', errData.parserError);
      reject(new Error(errData.parserError?.message || 'Unknown PDF parsing error'));
    });

    // Set up success handler
    pdfParser.on('pdfParser_dataReady', (pdfData: Output) => {
      try {
        const parsedPages = parsePdfData(pdfData);
        resolve(parsedPages);
      } catch (error) {
        reject(error);
      }
    });

    // Parse the buffer
    try {
      pdfParser.parseBuffer(pdfBuffer);
    } catch (error) {
      console.error('Error parsing PDF buffer:', error);
      reject(new Error('Failed to parse PDF buffer'));
    }
  });
}

/**
 * Analyze spatial proximity between text elements to determine word boundaries
 */
function parseTextElementWithHeuristics(elements: Text[]): string {
  if (elements.length === 0) return '';
  if (elements.length === 1) return elements[0]?.R?.[0]?.T || '';

  let result = '';
  for (const [index, currentElement] of elements.entries()) {
    const nextElement = elements[index + 1];
    const spacing = determineSpacing(currentElement, nextElement);
    const decodedText = decodeURIComponent(currentElement.R[0]?.T || '');
    switch (spacing) {
      case 'join':
        // Direct concatenation - likely same word split
        result += decodedText;
        break;
      case 'space':
        // Normal word boundary
        result += ' ' + decodedText;
        break;
      case 'newline':
        // if the next element will be on a new line, truncate the hyphen if it exists
        if (decodedText.slice(-1) === '-') {
          result += decodedText.slice(0, -1);
        } else {
          result += decodedText + '\n ';
        }
        break;
    }
  }

  return decodeURIComponent(result);
}

function parseTextElementNatively(elements: Text[]): string {
  return elements.map((element) => decodeURIComponent(element.R?.[0]?.T || '')).join(' ');
}

/**
 * Determine appropriate spacing between two text elements based on their positions
 */
function determineSpacing(current: Text, next: Text | undefined): 'join' | 'space' | 'newline' {
  if (!next) {
    return 'newline';
  }
  const horizontalDistance = next.x - current.x;
  const verticalDistance = Math.abs(next.y - current.y);

  // Estimate character width based on font size (rough approximation)
  const avgCharWidth = current.w * 0.6;

  // Estimate line height from font size in TextRun TS array
  // TS format: [fontFaceId, fontSize, bold, italic]
  const fontSize = current.R?.[0]?.TS?.[1] || 12; // Default to 12 if no font size found
  const lineHeight = fontSize * 1.2; // Typical line height is 1.2x font size

  if (verticalDistance > 0 && horizontalDistance < 0) {
    return 'newline';
  }

  // If horizontal distance is very small or negative, likely same word
  if (horizontalDistance <= avgCharWidth * 0.3) {
    return 'join';
  }

  // Large gap - treat as space but could be tabular data
  return 'space';
}
