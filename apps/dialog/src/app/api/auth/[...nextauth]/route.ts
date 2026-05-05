import { NextRequest } from 'next/server';
import { handlers } from '@/auth';

/**
 * Rewrites the request origin using x-forwarded-proto and x-forwarded-host headers
 * set by the reverse proxy, so Auth.js generates the correct redirect_uri
 * pointing to the stable public domain instead of the pod's internal hostname.
 *
 * Precondition: the Kubernetes ingress must forward x-forwarded-host (standard
 * behaviour for nginx ingress, but may need to be verified for this service).
 *
 * When AUTH_URL is set (e.g. in CI), next-auth's own reqWithEnvURL already
 * rewrites the URL before reaching this handler, so there is no conflict.
 */
function withTrustedOrigin(req: NextRequest): NextRequest {
  const proto = req.headers.get('x-forwarded-proto');
  const host = req.headers.get('x-forwarded-host');
  if (!proto || !host) return req;

  const trustedOrigin = `${proto}://${host}`;
  const { href, origin } = req.nextUrl;
  return new NextRequest(href.replace(origin, trustedOrigin), req);
}

export const GET = (req: NextRequest) => handlers.GET(withTrustedOrigin(req));
export const POST = (req: NextRequest) => handlers.POST(withTrustedOrigin(req));
