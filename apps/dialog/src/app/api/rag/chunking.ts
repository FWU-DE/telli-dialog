import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// Tuned for BAAI/bge-m3 (8192-token context window)
const CHUNK_SIZE = 2500; // typical sweet spot to balance context richness with retrieval relevance
const CHUNK_OVERLAP = 0; // no overlap to prevent duplicate text in retrieval results

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
});

/**
 * Splits text into chunks using RecursiveCharacterTextSplitter.
 *
 * The recursive splitter tries paragraph breaks first, then sentences, then words,
 * which naturally respects document structure.
 */
export async function chunkText(text: string): Promise<string[]> {
  return splitter.splitText(text);
}
