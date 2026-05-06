// This adds authentication for the whole application. No public pages, except for the excludes in config
export { auth as proxy } from '@/auth';

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - `/api/healthz` (healthcheck API route)
     * - `/api/auth/*` (next-auth routes)
     */
    '/((?!api/healthz$|api/auth/).*)',
  ],
};
