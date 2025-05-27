import { expect, describe, it } from 'vitest';
import { chunkText } from './process-chunks';

describe('chunkText', () => {
  it('chunks text by sentences with overlap', async () => {
    const text = [
      'This is the first sentence.',
      'Here is the second sentence.',
      'This is the third sentence.',
      'And here is the fourth sentence.',
      'And here is the fifth sentence.',
      'And here is the sixth sentence.',
      'And here is the seventh sentence.',
      'And here is the eighth sentence.',
      'And here is the ninth sentence.',
      'And here is the tenth sentence.',
    ].join(' ');
    const chunks = chunkText({ text, sentenceChunkOverlap: 1, lowerBoundWordCount: 10 });
    // Each chunk should include overlap of previous and next sentence
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.content).toContain('This is the first sentence.');
    expect(chunks[0]?.content).toContain('Here is the second sentence.');
    expect(chunks[1]?.content).toContain('Here is the second sentence.');
    expect(chunks[1]?.content).toContain('This is the third sentence.');
  });

  it('falls back to word-based chunking with overlap if sentence splitting fails', async () => {
    const text = 'word '.repeat(1000).trim();
    const chunks = chunkText({ text, sentenceChunkOverlap: 32, lowerBoundWordCount: 10 });
    expect(chunks.length).toBeGreaterThan(1);
    // Overlap: the second chunk should contain words from the end of the previous chunk
    const firstChunkWords = chunks[0]?.content.split(/\s+/);
    const secondChunkWords = chunks[1]?.content.split(/\s+/);
    expect(secondChunkWords?.slice(0, 32)).toEqual(firstChunkWords?.slice(-32));
  });

  it('handles small text as a single chunk', async () => {
    const text = 'Short text.';
    const chunks = chunkText({ text, sentenceChunkOverlap: 1, lowerBoundWordCount: 10 });
    expect(chunks.length).toBe(1);
    expect(chunks[0]?.content).toContain('Short text.');
  });

  it('ensures sentence overlap at chunk boundaries', async () => {
    const text = [
      'Sentence one with a lot of words.',
      'Sentence two with a lot of words.',
      'Sentence three with a lot of words.',
      'Sentence four with a lot of words.',
      'Sentence five with a lot of words.',
    ].join(' ');
    const chunks = chunkText({ text, sentenceChunkOverlap: 1, lowerBoundWordCount: 10 });
    // The last chunk should include the last and the previous sentence
    expect(chunks[1]?.content).toContain('Sentence two with a lot of words.');
    expect(chunks[1]?.content).toContain('Sentence three with a lot of words.');
    expect(chunks[1]?.content).toContain('Sentence four with a lot of words.');
  });

  it('handles 5 short sentences and one very long sentence (>200 words)', async () => {
    const shortSentences = [
      'Short one.',
      'Short two.',
      'Short three.',
      'Short four.',
      'Short five.',
    ];
    const longSentence =
      'This is a very long sentence. '.repeat(20) +
      'It keeps going and going, with more and more words, to ensure it is well over two hundred words. '.repeat(
        10,
      );
    const text = [...shortSentences, longSentence].join(' ');
    const chunks = chunkText({ text, sentenceChunkOverlap: 1, lowerBoundWordCount: 50 });
    // Should create multiple chunks due to the long sentence
    expect(chunks.length).toBeGreaterThan(1);
    // All short sentences should be present in the first chunk
    for (const s of shortSentences) {
      expect(chunks[0]?.content).toContain(s);
    }
    // The long sentence should be split across chunks
    const longSentenceWords = longSentence.split(/\s+/).filter(Boolean);
    let foundLongSentenceWords = 0;
    for (const chunk of chunks) {
      for (const word of longSentenceWords) {
        if (chunk.content.includes(word)) {
          foundLongSentenceWords++;
          break;
        }
      }
    }
    expect(foundLongSentenceWords).toBeGreaterThan(0);
    // The last chunk should contain part of the long sentence
    expect(chunks[chunks.length - 1]?.content).toContain('going, with more and more words');
  });
});
