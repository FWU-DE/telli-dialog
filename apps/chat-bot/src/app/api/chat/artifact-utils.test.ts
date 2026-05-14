import { describe, it, expect } from 'vitest';
import {
  parseArtifactFromText,
  stripArtifactFromText,
  extractStreamingArtifact,
  stripArtifactBlock,
} from './artifact-utils';

const SAMPLE_HTML = '<!DOCTYPE html><html><body><p>Hello</p></body></html>';

const wrapArtifact = (title: string, content: string) =>
  `<artifact type="html" title="${title}">${content}</artifact>`;

describe('parseArtifactFromText', () => {
  it('extracts title and content from a complete artifact block', () => {
    const text = wrapArtifact('My App', SAMPLE_HTML);
    const result = parseArtifactFromText(text);
    expect(result).toEqual({ title: 'My App', content: SAMPLE_HTML });
  });

  it('trims whitespace from content', () => {
    const text = `<artifact type="html" title="Test">\n  ${SAMPLE_HTML}\n</artifact>`;
    const result = parseArtifactFromText(text);
    expect(result?.content).toBe(SAMPLE_HTML);
  });

  it('returns null when no artifact tag is present', () => {
    expect(parseArtifactFromText('Just some normal text')).toBeNull();
  });

  it('returns null for incomplete opening tag (still streaming)', () => {
    expect(parseArtifactFromText('<artifact type="html" title="Partial')).toBeNull();
  });

  it('extracts artifact when surrounded by prose', () => {
    const text = `Here is your app:\n${wrapArtifact('Counter', SAMPLE_HTML)}\nLet me know if you want changes.`;
    const result = parseArtifactFromText(text);
    expect(result).toEqual({ title: 'Counter', content: SAMPLE_HTML });
  });

  it('extracts last artifact when multiple complete blocks exist', () => {
    const first = wrapArtifact('First', '<html><body>1</body></html>');
    const second = wrapArtifact('Second', SAMPLE_HTML);
    const result = parseArtifactFromText(`Intro\n${first}\n${second}\nDone`);
    expect(result).toEqual({ title: 'Second', content: SAMPLE_HTML });
  });
});

describe('stripArtifactFromText', () => {
  it('removes complete artifact block leaving prose', () => {
    const text = `Here is the app:\n${wrapArtifact('Test', SAMPLE_HTML)}\nEnjoy!`;
    expect(stripArtifactFromText(text)).toBe('Here is the app:\n\nEnjoy!');
  });

  it('returns text unchanged when no artifact present', () => {
    const text = 'Just regular text.';
    expect(stripArtifactFromText(text)).toBe(text);
  });

  it('handles text that is only an artifact block', () => {
    const text = wrapArtifact('App', SAMPLE_HTML);
    expect(stripArtifactFromText(text)).toBe('');
  });
});

describe('extractStreamingArtifact', () => {
  it('returns null when no artifact tag has started', () => {
    expect(extractStreamingArtifact('Hello world')).toBeNull();
  });

  it('returns partial content while still inside the tag (no closing tag)', () => {
    const partial = '<artifact type="html" title="App"><!DOCTYPE html><html>';
    const result = extractStreamingArtifact(partial);
    expect(result).toBe('<!DOCTYPE html><html>');
  });

  it('returns full content once closing tag is present', () => {
    const full = wrapArtifact('App', SAMPLE_HTML);
    expect(extractStreamingArtifact(full)).toBe(SAMPLE_HTML);
  });

  it('returns empty string when artifact tag just opened (no content yet)', () => {
    const text = '<artifact type="html" title="App">';
    expect(extractStreamingArtifact(text)).toBe('');
  });

  it('uses the last artifact block when several appear in one stream', () => {
    const first = wrapArtifact('A', '<html>A</html>');
    const second = wrapArtifact('B', SAMPLE_HTML);
    expect(extractStreamingArtifact(`x${first}${second}`)).toBe(SAMPLE_HTML);
  });

  it('returns partial content for the last opening tag when two opens exist', () => {
    const first = wrapArtifact('A', '<html>A</html>');
    const partialSecond = '<artifact type="html" title="B"><p>loading';
    expect(extractStreamingArtifact(`${first}${partialSecond}`)).toBe('<p>loading');
  });
});

describe('stripArtifactBlock', () => {
  it('strips complete artifact block from prose', () => {
    const text = `Intro\n${wrapArtifact('App', SAMPLE_HTML)}\nOutro`;
    expect(stripArtifactBlock(text)).toBe('Intro\n\nOutro');
  });

  it('strips partial artifact tag still being streamed', () => {
    const text = 'Here is the app:\n<artifact type="html" title="App"><!DOCTYPE html>';
    expect(stripArtifactBlock(text)).toBe('Here is the app:');
  });

  it('returns text unchanged when no artifact tag present', () => {
    expect(stripArtifactBlock('Normal text.')).toBe('Normal text.');
  });

  it('handles text that is only a partial artifact tag', () => {
    expect(stripArtifactBlock('<artifact type="html" title="App">')).toBe('');
  });
});
