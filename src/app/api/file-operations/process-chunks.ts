import { split as splitSentences, SentenceSplitterSyntax } from 'sentence-splitter';

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
};

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
  }) {
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
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;
    let startIdx = 0;
  
    while (startIdx < pseudoSentences.length) {
      currentChunk = [];
      currentWordCount = 0;
      let endIdx = startIdx;
      // Add sentences until we reach the chunk size
      while (
        endIdx < pseudoSentences.length &&
        currentWordCount < lowerBoundWordCount
      ) {
        currentChunk.push(pseudoSentences[endIdx] ?? '');
        currentWordCount += countWords(pseudoSentences[endIdx] ?? '');
        endIdx++;
      }
      // Add overlap: preceding and following sentence if available
      const overlapStart = Math.max(0, startIdx - sentenceChunkOverlap);
      const overlapEnd = Math.min(pseudoSentences.length, endIdx + sentenceChunkOverlap);
      const chunkWithOverlap = pseudoSentences.slice(overlapStart, overlapEnd).join(' ');
      chunks.push(chunkWithOverlap);
      // Move to next chunk (start after the last sentence in this chunk)
      startIdx = endIdx;
    }
  
    return chunks;
  }