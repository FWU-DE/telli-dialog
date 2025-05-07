export function parseHostname(uri: string) {
  if (!uri) {
    return '';
  }
  try {
    return new URL(uri).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
