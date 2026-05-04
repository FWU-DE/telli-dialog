import { CHUNK_SIZE } from '@/configuration-text-inputs/const';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: 0, // no overlap to prevent duplicate text in retrieval results
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
