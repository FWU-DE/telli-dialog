/**
 * Strips the protocol and "www." prefix from a URL for display purposes.
 * Also converts the URL to lowercase for consistent display.
 *
 * Examples:
 * - `https://www.example.com` -> `example.com`
 * - `http://example.com` -> `example.com`
 * - `https://sub.domain.co.uk` -> `sub.domain.co.uk`
 *
 * @param uri The URL string to strip the prefix from.
 * @returns The URL without the protocol and "www." prefix.
 */
export function getDisplayUrl(uri: string) {
  if (!uri) {
    return '';
  }
  return uri.replace(/^https?:\/\/(www\.)?/i, '').toLowerCase();
}

/**
 * Parses HTTP/HTTPS URLs from content.
 *
 * URL Pattern Components:
 * | Component  | Pattern                          | Matches                                |
 * |------------|----------------------------------|----------------------------------------|
 * | Protocol   | `https?:\/\/`                    | `http://` or `https://`                |
 * | www prefix | `(www\.)?`                       | Optional `www.`                        |
 * | Domain     | `[-a-zA-Z0-9@:%._+~#=]{1,256}`   | alphanumeric and special chars (1-256) |
 * | TLD        | `\.[a-zA-Z0-9()]{1,24}`          | `.com`, `.org`, etc. (1-24 chars)      |
 * | Path/Query | `([-a-zA-Z0-9()@:%_+.~#?&/=]*)`  | Optional path, query params, fragments |
 *
 * Examples matched:
 * - `https://example.com`
 * - `http://www.example.org/path?query=1`
 * - `https://sub.domain.co.uk/page#section`
 *
 * @param content The string content to parse for URLs.
 * @returns An array of URLs found in the content, or undefined if none are found.
 */
export function parseHyperlinks(content: string): string[] | undefined {
  const urlPattern =
    /(https?:\/\/)(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,24}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;
  const matches = content.match(urlPattern) || [];
  if (matches[0] === undefined) {
    return undefined;
  }

  return matches;
}
