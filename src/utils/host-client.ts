export function getBaseUrlFromClient(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

export function getHostnameFromClient(): string {
  return typeof window !== 'undefined' ? window.location.hostname : '';
}
