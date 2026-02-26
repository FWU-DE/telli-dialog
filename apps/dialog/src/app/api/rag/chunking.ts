import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 300;

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
export async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  return splitter.splitText(text);
}
