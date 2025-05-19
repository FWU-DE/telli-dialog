import { split as splitSentences, SentenceSplitterSyntax } from 'sentence-splitter';
import { TextChunkModel } from '@/db/schema';

export type ChunkResult = Omit<TextChunkModel, 'embedding' | 'contentTsv' | 'createdAt'> & {fileName: string};

function splitLongSentence(sentence: string, maxSentenceWords: number): string[] {
  const words = sentence.trim().split(/\s+/);
  if (words.length <= maxSentenceWords) return [sentence];
  const parts: string[] = [];
  let i = 0;
  while (i < words.length) {
    parts.push(words.slice(i, i + maxSentenceWords).join(' '));
    i += maxSentenceWords;
  }
  return parts;
}

export function chunkText({
  text,
  sentenceChunkOverlap,
  fallBackChunkSize = 250,
  fallBackChunkOverlap = 50,
  lowerBoundWordCount = 200,
}: {
  text: string;
  sentenceChunkOverlap: number;
  fallBackChunkSize?: number;
  fallBackChunkOverlap?: number;
  lowerBoundWordCount?: number;
}){
  // Helper to count words
  function countWords(str: string) {
    return str.trim().split(/\s+/).length;
  }

  // Try sentence splitting
  let sentences: string[] = [];
  try {
    const nodes = splitSentences(text);
    sentences = nodes
      .filter((node) => node.type === SentenceSplitterSyntax.Sentence)
      .map((node) => {
        // Join all string children for the sentence
        return node.children
          .filter((child) => child.type === 'Str' || child.type === 'Punctuation')
          .map((child) => child.value)
          .join('');
      });
  } catch (e) {
    sentences = [];
  }

  // Ensure each sentence is below 100 words
  const maxSentenceWords = 100;

  let pseudoSentences: string[] = [];
  for (const sentence of sentences) {
    pseudoSentences.push(...splitLongSentence(sentence, maxSentenceWords));
  }

  // Sentence-based chunking
  const chunks: {
    content: string;
    leadingOverlap?: string;
    trailingOverlap?: string;
  }[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;
  let startIdx = 0;

  while (startIdx < pseudoSentences.length) {
    currentChunk = [];
    currentWordCount = 0;
    let endIdx = startIdx;
    // Add sentences until we reach the chunk size
    while (endIdx < pseudoSentences.length && currentWordCount < lowerBoundWordCount) {
      currentChunk.push(pseudoSentences[endIdx] ?? '');
      currentWordCount += countWords(pseudoSentences[endIdx] ?? '');
      endIdx++;
    }
    // Add overlap: preceding and following sentence if available
    const overlapStart = Math.max(0, startIdx - sentenceChunkOverlap);
    const overlapEnd = Math.min(pseudoSentences.length, endIdx + sentenceChunkOverlap);
    const chunkWithOverlap = pseudoSentences.slice(overlapStart, overlapEnd).join(' ');
    chunks.push({
      content: chunkWithOverlap,
      leadingOverlap: pseudoSentences[overlapStart],
      trailingOverlap: pseudoSentences[overlapEnd],
    });
    // Move to next chunk (start after the last sentence in this chunk)
    startIdx = endIdx;
  }

  return chunks;
}

/**
 * Groups retrieved text chunks by fileId and sorts them by orderIndex within each group
 * @param chunks Array of text chunks with fileId and orderIndex properties
 * @returns Object with fileIds as keys and arrays of sorted chunks as values
 */
export function groupAndSortChunks(chunks: Array<ChunkResult>) {
  // Group chunks by fileId
  const groupedChunks = chunks.reduce(
    (acc, chunk) => {
      if (acc === undefined || !acc[chunk.fileId]) {
        acc[chunk.fileId] = [];
      }
      acc?.[chunk.fileId]?.push(chunk);
      return acc;
    },
    {} as Record<string, ChunkResult[]>,
  );

  // Sort each group by orderIndex and remove overlaps
  Object.keys(groupedChunks).forEach((fileId) => {
    groupedChunks?.[fileId]?.sort((a, b) => a.orderIndex - b.orderIndex);
  });

  return groupedChunks;
}
