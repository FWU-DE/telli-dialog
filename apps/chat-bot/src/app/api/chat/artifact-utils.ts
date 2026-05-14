export type ParsedArtifact = {
  title: string;
  content: string;
};

/** Extracts title + content from the last complete <artifact> block (multiple per reply supported). */
export function parseArtifactFromText(text: string): ParsedArtifact | null {
  const re = /<artifact\s+type="html"\s+title="([^"]*)">([\s\S]*?)<\/artifact>/g;
  let match: RegExpExecArray | null;
  let last: ParsedArtifact | null = null;
  while ((match = re.exec(text)) !== null) {
    last = { title: match[1] ?? '', content: match[2]?.trim() ?? '' };
  }
  return last;
}

/** Removes complete <artifact> blocks from text, leaving only prose. */
export function stripArtifactFromText(text: string): string {
  return text.replace(/<artifact\s+type="html"\s+title="[^"]*">[\s\S]*?<\/artifact>/g, '').trim();
}

/**
 * Extracts artifact HTML content being streamed — partial content while inside the tag,
 * final content once the closing tag is seen. Uses the last opening `<artifact …>` so
 * preview tracks the current block when several appear in one stream.
 */
export function extractStreamingArtifact(raw: string): string | null {
  const openTag = '<artifact ';
  const openIdx = raw.lastIndexOf(openTag);
  if (openIdx === -1) return null;
  const contentStart = raw.indexOf('>', openIdx);
  if (contentStart === -1) return null;
  const closeIdx = raw.indexOf('</artifact>', contentStart + 1);
  const content =
    closeIdx !== -1 ? raw.slice(contentStart + 1, closeIdx) : raw.slice(contentStart + 1);
  return content.trim();
}

/** Strips the artifact XML block from prose, including a partial opening tag still being streamed. */
export function stripArtifactBlock(raw: string): string {
  let prose = raw.replace(/<artifact\s[^>]*>[\s\S]*?<\/artifact>/g, '');
  prose = prose.replace(/<artifact[\s\S]*$/, '');
  return prose.trim();
}
