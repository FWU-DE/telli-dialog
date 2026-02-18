export function isDevelopment(): boolean {
  // Next.js automatically replaces process.env.NODE_ENV at build time
  // so it's safe to use on both client and server
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}
