import { describe, expect, it } from 'vitest';
import {
  hardenHtmlForIframeSrcdoc,
  LLM_HTML_IFRAME_REFERRER_POLICY,
  LLM_HTML_IFRAME_SANDBOX,
  wrapFragmentInMinimalDocument,
} from './sandboxed-llm-html-iframe';

/** Directives we inject via meta CSP (defense in depth for srcDoc iframes). */
function expectInjectedCspGuards(doc: string) {
  expect(doc).toMatch(/Content-Security-Policy/i);
  expect(doc).toContain("default-src 'none'");
  expect(doc).toContain("base-uri 'none'");
  expect(doc).toContain("object-src 'none'");
  expect(doc).toContain("frame-src 'none'");
  expect(doc).toContain("worker-src 'none'");
  expect(doc).toContain("connect-src 'none'");
  expect(doc).toContain("script-src 'unsafe-inline'");
  expect(doc).toContain("style-src 'unsafe-inline'");
  expect(doc).toContain('upgrade-insecure-requests');
  expect(doc).not.toContain('unsafe-eval');
}

describe('LLM iframe sandbox contract (security)', () => {
  it('allows only scripts in sandbox token list (no same-origin + scripts)', () => {
    expect(LLM_HTML_IFRAME_SANDBOX).toBe('allow-scripts');
    expect(LLM_HTML_IFRAME_SANDBOX).not.toContain('allow-same-origin');
    expect(LLM_HTML_IFRAME_SANDBOX).not.toContain('allow-forms');
    expect(LLM_HTML_IFRAME_SANDBOX).not.toContain('allow-popups');
    expect(LLM_HTML_IFRAME_SANDBOX).not.toContain('allow-top-navigation');
    expect(LLM_HTML_IFRAME_SANDBOX).not.toContain('allow-downloads');
  });

  it('uses no-referrer so chat URLs are not sent as Referer to subresources', () => {
    expect(LLM_HTML_IFRAME_REFERRER_POLICY).toBe('no-referrer');
  });
});

describe('wrapFragmentInMinimalDocument', () => {
  it('wraps untrusted fragment in a minimal document shell', () => {
    const doc = wrapFragmentInMinimalDocument('<img src=x onerror=alert(1)>');
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain('<meta charset="utf-8">');
    expect(doc).toContain('<img src=x onerror=alert(1)>');
    expect(doc).toMatch(/<\/body>\s*<\/html>\s*$/);
  });
});

describe('hardenHtmlForIframeSrcdoc', () => {
  it('injects CSP after existing head', () => {
    const raw = '<!DOCTYPE html><html><head><title>t</title></head><body><p>x</p></body></html>';
    const out = hardenHtmlForIframeSrcdoc(raw);
    expectInjectedCspGuards(out);
    expect(out).toContain('<title>t</title>');
    expect(out).toMatch(/<head[^>]*>\s*<meta[^>]*Content-Security-Policy/);
  });

  it('adds head with CSP when html has no head', () => {
    const raw = '<html><body><p>y</p></body></html>';
    const out = hardenHtmlForIframeSrcdoc(raw);
    expectInjectedCspGuards(out);
    expect(out).toContain('<p>y</p>');
  });

  it('does not add a second CSP if one exists', () => {
    const raw =
      '<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="default-src *"></head><body></body></html>';
    const out = hardenHtmlForIframeSrcdoc(raw);
    const count = (out.match(/Content-Security-Policy/gi) ?? []).length;
    expect(count).toBe(1);
  });

  it('treats existing CSP meta anywhere in the string as authoritative (no second injection)', () => {
    const raw =
      '<html><body><p>x</p><meta http-equiv="content-security-policy" content="default-src *"></body></html>';
    const out = hardenHtmlForIframeSrcdoc(raw);
    expect(out).toBe(raw);
  });

  it('is idempotent on already-hardened output', () => {
    const once = hardenHtmlForIframeSrcdoc('<html><head></head><body></body></html>');
    const twice = hardenHtmlForIframeSrcdoc(once);
    expect(twice).toBe(once);
  });

  it('hardens empty input to a minimal document with CSP', () => {
    const out = hardenHtmlForIframeSrcdoc('');
    expectInjectedCspGuards(out);
    expect(out).toContain('<body></body>');
  });

  it('hardens whitespace-only input', () => {
    const out = hardenHtmlForIframeSrcdoc(' \n\t ');
    expectInjectedCspGuards(out);
  });

  it('matches head with attributes (case-insensitive)', () => {
    const raw = '<!DOCTYPE html><HTML><HEAD class="x"><title>t</title></HEAD><body></body></HTML>';
    const out = hardenHtmlForIframeSrcdoc(raw);
    expectInjectedCspGuards(out);
    expect(out).toContain('<title>t</title>');
  });

  it('keeps CSP meta content in a double-quoted attribute without raw double quotes inside', () => {
    const out = hardenHtmlForIframeSrcdoc('<html><head></head><body></body></html>');
    const m = out.match(/<meta[^>]*http-equiv="Content-Security-Policy"[^>]*content="([^"]+)"/i);
    expect(m?.[1]).toBeDefined();
    expect(m![1]).not.toContain('"');
    expect(m![1]).toContain("connect-src 'none'");
  });

  it('injects CSP into full document that loads an external script (CSP still blocks typical exfil paths)', () => {
    const raw =
      '<!DOCTYPE html><html><head><title>t</title></head><body><script src="https://evil.example/x.js"></script></body></html>';
    const out = hardenHtmlForIframeSrcdoc(raw);
    expectInjectedCspGuards(out);
    expect(out).toContain('https://evil.example/x.js');
    expect(out.match(/script-src[^"']*unsafe-eval/i)).toBeNull();
  });
});
