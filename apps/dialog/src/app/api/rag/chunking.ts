import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Splits text into chunks using RecursiveCharacterTextSplitter.
 *
 * Tuned for BAAI/bge-m3 (8192-token context window):
 * - chunkSize: 1500 characters — captures more semantic context per embedding
 * - chunkOverlap: 300 characters — preserves context across chunk boundaries
 *
 * The recursive splitter tries paragraph breaks first, then sentences, then words,
 * which naturally respects document structure.
 */
export async function chunkText({
  text,
  chunkSize = 1500,
  chunkOverlap = 300,
}: {
  text: string;
  chunkSize?: number;
  chunkOverlap?: number;
}): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  return splitter.splitText(text);
}
