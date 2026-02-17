/**
 * Ensures callbackUrl is a safe, relative path for redirects.
 * Prevents open redirect attacks by rejecting absolute URLs and protocol-relative URLs.
 */
export function getSafeCallbackUrl(url: string | null): string {
  if (!url) {
    return '/';
  }
  if (!url.startsWith('/') || url.startsWith('//')) {
    return '/';
  }
  return url;
}
