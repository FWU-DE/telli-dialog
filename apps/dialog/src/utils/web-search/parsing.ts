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

export function stripUrlPrefix(uri: string) {
  if (!uri) {
    return '';
  }
  return uri.replace(/^https?:\/\/(www\.)?/, '');
}

export function parseHyperlinks(content: string): string[] | undefined {
  const urlPattern =
    /(https?:\/\/)(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,24}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;
  const matches = content.match(urlPattern) || [];
  if (matches[0] === undefined) {
    return undefined;
  }

  return matches;
}
