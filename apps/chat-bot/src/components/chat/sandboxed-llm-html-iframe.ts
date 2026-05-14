/**
 * Sandboxed iframes for LLM-generated HTML (chat preview, artifacts).
 *
 * **Sandbox**
 * - `allow-scripts`: inline JS (e.g. calculators, widgets). Still runs in an **opaque / null origin**
 *   when `srcDoc` is used — scripts cannot read the parent page or embedding origin cookies.
 * - **Never** combine `allow-same-origin` with `allow-scripts` for untrusted HTML: that pair gives
 *   the iframe a real origin and allows same-origin reads against the embedding site in many cases.
 * - We intentionally omit `allow-forms`: form **submission** to third parties is a common exfil path;
 *   interactive UIs should use buttons + JS (`preventDefault`) instead of navigational forms.
 * - Omitted: `allow-popups`, `allow-top-navigation*`, `allow-downloads` — reduce phishing / drive-by.
 *
 * **Defense in depth**
 * - A strict **Content-Security-Policy** is injected when missing (see `hardenHtmlForIframeSrcdoc`).
 * - `referrerPolicy="no-referrer"` avoids leaking chat URLs to subresources the document might load.
 *
 * **Trade-offs**
 * - `connect-src 'none'` blocks `fetch()` / XHR to the network (good for exfil); purely local demos
 *   (DOM + inline JS) still work. External `<script src="…">` are blocked unless you extend CSP.
 * - No `unsafe-eval`: `eval` / `new Function` based snippets will fail; typical calculators do not need it.
 */
export const LLM_HTML_IFRAME_SANDBOX = 'allow-scripts' as const;

export const LLM_HTML_IFRAME_REFERRER_POLICY = 'no-referrer' as const;

const LLM_SRCDOC_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "connect-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data: blob: https:',
  'font-src data: https:',
  'media-src data: blob:',
  "manifest-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

function escapeMetaAttributeValue(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function wrapFragmentInMinimalDocument(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${body}</body></html>`;
}

/**
 * Injects a strict CSP when the document does not already define one, and wraps bare fragments.
 * Safe to call on every `srcDoc` update (idempotent if CSP meta already present).
 */
export function hardenHtmlForIframeSrcdoc(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return hardenHtmlForIframeSrcdoc(wrapFragmentInMinimalDocument(''));
  }

  if (/<meta[^>]+http-equiv\s*=\s*["']?\s*content-security-policy/gi.test(html)) {
    return html;
  }

  const headOpen = /<head(\s[^>]*)?>/i;
  const headMatch = headOpen.exec(html);
  if (headMatch) {
    const tag = headMatch[0];
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${escapeMetaAttributeValue(LLM_SRCDOC_CSP)}">`;
    return html.replace(tag, `${tag}${cspMeta}`);
  }

  const htmlOpen = /<html(\s[^>]*)?>/i;
  const htmlMatch = htmlOpen.exec(html);
  if (htmlMatch) {
    const tag = htmlMatch[0];
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${escapeMetaAttributeValue(LLM_SRCDOC_CSP)}">`;
    return html.replace(tag, `${tag}<head><meta charset="utf-8">${cspMeta}</head>`);
  }

  return hardenHtmlForIframeSrcdoc(wrapFragmentInMinimalDocument(trimmed));
}
