import { describe, expect, it } from 'vitest';
import { previewDownloadFileName } from '@/components/chat/html-preview-srcdoc';
import { sanitizeChatNameForDownloadBasename } from './sanitize-download-filename';

describe('sanitizeChatNameForDownloadBasename', () => {
  it('returns empty for nullish or blank', () => {
    expect(sanitizeChatNameForDownloadBasename(null)).toBe('');
    expect(sanitizeChatNameForDownloadBasename(undefined)).toBe('');
    expect(sanitizeChatNameForDownloadBasename('   ')).toBe('');
  });

  it('replaces unsafe characters and collapses whitespace', () => {
    expect(sanitizeChatNameForDownloadBasename('Foo / Bar')).toBe('Foo-Bar');
    expect(sanitizeChatNameForDownloadBasename('a  b\tc')).toBe('a-b-c');
  });

  it('treats dash-only result as empty', () => {
    expect(sanitizeChatNameForDownloadBasename('///')).toBe('');
  });

  it('truncates long names', () => {
    const long = 'x'.repeat(100);
    expect(sanitizeChatNameForDownloadBasename(long).length).toBe(80);
  });

  it('neutralizes path separators and reserved punctuation for single-segment file names', () => {
    expect(sanitizeChatNameForDownloadBasename('..\\..\\etc')).toBe('-..-etc');
    expect(sanitizeChatNameForDownloadBasename('a:b*c?d"e<f>|g')).toBe('a-b-c-d-e-f-g');
  });

  it('strips ASCII control characters', () => {
    expect(sanitizeChatNameForDownloadBasename('a\u0000b\u001fb')).toBe('a-b-b');
  });

  it('preserves letters across scripts when not only punctuation', () => {
    expect(sanitizeChatNameForDownloadBasename('Chat 日本語')).toBe('Chat-日本語');
  });

  it('strips leading and trailing dots', () => {
    expect(sanitizeChatNameForDownloadBasename('...visible...')).toBe('visible');
  });

  it('collapses repeated hyphens after replacements', () => {
    expect(sanitizeChatNameForDownloadBasename('a   ///   b')).toBe('a-b');
  });
});

describe('sanitize + preview download file name', () => {
  it('uses a basename without path separators in the download file name', () => {
    const raw = 'foo/bar\\baz';
    const safe = sanitizeChatNameForDownloadBasename(raw);
    expect(safe).not.toMatch(/[/\\]/);
    expect(previewDownloadFileName('html', raw)).toBe(`${safe}-html-ausgabe.html`);
  });
});
