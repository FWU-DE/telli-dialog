export function parseHostname(uri: string) {
  if (!uri) {
    return '';
  }
  return new URL(uri).hostname.replace(/^www\./, '');
}
