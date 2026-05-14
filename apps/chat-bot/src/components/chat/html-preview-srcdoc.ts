import { sanitizeChatNameForDownloadBasename } from '@/utils/sanitize-download-filename';
import {
  hardenHtmlForIframeSrcdoc,
  wrapFragmentInMinimalDocument,
} from './sandboxed-llm-html-iframe';

function buildRawPreviewSrcDoc(content: string, language: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return wrapFragmentInMinimalDocument('');
  }

  if (language === 'svg') {
    return wrapFragmentInMinimalDocument(trimmed);
  }

  if (language === 'html') {
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('<!doctype') || lower.startsWith('<html')) {
      return content;
    }
    return wrapFragmentInMinimalDocument(trimmed);
  }

  return wrapFragmentInMinimalDocument(trimmed);
}

/**
 * Builds document source for a sandboxed iframe preview of a fenced code block.
 * Full documents (DOCTYPE / html root) are passed through unchanged before hardening.
 */
export function buildPreviewSrcDoc(content: string, language: string): string {
  return hardenHtmlForIframeSrcdoc(buildRawPreviewSrcDoc(content, language));
}

export function previewDownloadFileName(
  language: string,
  conversationName?: string | null,
): string {
  const base = sanitizeChatNameForDownloadBasename(conversationName);
  const lang = language.toLowerCase();
  const ext = lang === 'svg' ? 'svg' : 'html';
  const kind = lang === 'svg' ? 'svg-ausgabe' : 'html-ausgabe';
  if (base) {
    return `${base}-${kind}.${ext}`;
  }
  return lang === 'svg' ? 'chat-svg-ausgabe.svg' : 'chat-html-ausgabe.html';
}

export function artifactDownloadFileName(conversationName?: string | null): string {
  const base = sanitizeChatNameForDownloadBasename(conversationName);
  if (base) {
    return `${base}-artifact.html`;
  }
  return 'chat-artifact.html';
}

export function previewDownloadMimeType(language: string): string {
  return language === 'svg' ? 'image/svg+xml' : 'text/html';
}
