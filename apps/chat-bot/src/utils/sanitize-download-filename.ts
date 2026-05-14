/** Makes a conversation/chat title safe as a single path segment in download file names. */
export function sanitizeChatNameForDownloadBasename(name: string | null | undefined): string {
  if (!name?.trim()) {
    return '';
  }
  const out = name
    .trim()
    .replace(/[/\\:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .slice(0, 80);
  if (!out.replace(/-/g, '')) {
    return '';
  }
  return out;
}
