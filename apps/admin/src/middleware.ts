// This adds authentication for the whole application. No public pages, except for the excludes in config
export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Match all request paths except for `api/healthz` (healthcheck API route)
     */
    '/((?!api/healthz$).*)',
  ],
};
