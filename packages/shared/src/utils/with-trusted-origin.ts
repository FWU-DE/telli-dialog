import { NextRequest } from 'next/server';

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
export function withTrustedOrigin(req: NextRequest): NextRequest {
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const forwardedHost = req.headers.get('x-forwarded-host');
  if (!forwardedProto || !forwardedHost) return req;

  const proto = forwardedProto.split(',')[0]?.trim();
  const host = forwardedHost.split(',')[0]?.trim();

  if (!proto || !host) return req;
  if (proto !== 'http' && proto !== 'https') return req;

  const trustedOrigin = `${proto}://${host}`;
  const { href, origin } = req.nextUrl;
  return new NextRequest(href.replace(origin, trustedOrigin), req);
}
