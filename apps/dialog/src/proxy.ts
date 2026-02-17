import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy to add the current path to request headers.
 * This allows server components to access the URL for redirect handling.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // Set the current pathname for use in server components
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
