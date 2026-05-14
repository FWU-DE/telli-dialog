import { describe, expect, it } from 'vitest';
import {
  artifactDownloadFileName,
  buildPreviewSrcDoc,
  previewDownloadFileName,
  previewDownloadMimeType,
} from './html-preview-srcdoc';

describe('buildPreviewSrcDoc', () => {
  it('wraps a bare HTML fragment and applies CSP', () => {
    const doc = buildPreviewSrcDoc('<p>Hi</p>', 'html');
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain('<p>Hi</p>');
    expect(doc).toContain('Content-Security-Policy');
  });

  it('hardens HTML fragments with CSP guards (no unsafe-eval; blocks typical exfil directives)', () => {
    const doc = buildPreviewSrcDoc('<div onclick="void 0">x</div>', 'html');
    expect(doc).toContain('Content-Security-Policy');
    expect(doc).toContain("connect-src 'none'");
    expect(doc).toContain("frame-src 'none'");
    expect(doc).toContain("object-src 'none'");
    expect(doc).not.toContain('unsafe-eval');
    expect(doc).toContain('<div onclick="void 0">x</div>');
  });

  it('injects CSP into a full HTML document', () => {
    const full = '<!DOCTYPE html><html><head><title>x</title></head><body>x</body></html>';
    const out = buildPreviewSrcDoc(full, 'html');
    expect(out).toContain('Content-Security-Policy');
    expect(out).toContain('<title>x</title>');
  });

  it('passes through full document content for html root without duplicating outer tags', () => {
    const full = '<html><head><meta charset="utf-8"></head><body>x</body></html>';
    const out = buildPreviewSrcDoc(full, 'html');
    expect(out).toContain('Content-Security-Policy');
    expect(out).toContain('x</body>');
  });

  it('wraps SVG snippet in a document with CSP', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>';
    const doc = buildPreviewSrcDoc(svg, 'svg');
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain(svg);
    expect(doc).toContain('Content-Security-Policy');
  });

  it('returns empty body wrapper with CSP for whitespace-only content', () => {
    const doc = buildPreviewSrcDoc('   \n  ', 'html');
    expect(doc).toContain('<body></body>');
    expect(doc).toContain('Content-Security-Policy');
  });
});

describe('preview download helpers', () => {
  it('picks svg vs html extension and mime', () => {
    expect(previewDownloadFileName('svg')).toBe('chat-svg-ausgabe.svg');
    expect(previewDownloadMimeType('svg')).toBe('image/svg+xml');
    expect(previewDownloadFileName('html')).toBe('chat-html-ausgabe.html');
    expect(previewDownloadMimeType('html')).toBe('text/html');
  });

  it('uses sanitized conversation name in file name when provided', () => {
    expect(previewDownloadFileName('html', 'Mein Chat')).toBe('Mein-Chat-html-ausgabe.html');
    expect(previewDownloadFileName('svg', 'Logo')).toBe('Logo-svg-ausgabe.svg');
  });

  it('falls back to default when name sanitizes to empty', () => {
    expect(previewDownloadFileName('html', '///')).toBe('chat-html-ausgabe.html');
  });

  it('artifact download uses basename or default', () => {
    expect(artifactDownloadFileName(null)).toBe('chat-artifact.html');
    expect(artifactDownloadFileName('Projekt X')).toBe('Projekt-X-artifact.html');
  });
});
