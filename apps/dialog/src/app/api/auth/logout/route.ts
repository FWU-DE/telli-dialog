import { env } from '@/env';
import { logError, logInfo, logWarning } from '@/utils/logging/logging';
import { getToken, JWT } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const LOGOUT_CALLBACK_URL = new URL('/api/auth/logout-callback', env.nextauthUrl);
const VIDIS_LOGOUT_URL = new URL(env.vidisIssuerUri + '/protocol/openid-connect/logout');

function handleEmptyToken() {
  logWarning('No valid token found, redirecting to logout-callback url');
  return NextResponse.redirect(LOGOUT_CALLBACK_URL);
}

function redirectToIDP(token: JWT) {
  logInfo('Redirecting to IDP with token for logout');
  const logoutUrl = new URL(VIDIS_LOGOUT_URL);
  logoutUrl.searchParams.append('id_token_hint', token.id_token as string);
  logoutUrl.searchParams.append('post_logout_redirect_uri', LOGOUT_CALLBACK_URL.toString());
  return NextResponse.redirect(logoutUrl);
}

/**
/**
 * Route to handle logout.
 * If a valid JWT token is available, we redirect to the IDP to logout current session.
 * If no token is available, we simply redirect to the login page.
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = req.cookies.getAll();
    const tokenRaw = await getToken({ req, secret: env.authSecret, raw: true });
    const cookieNames = cookies.map((c) => c.name).join(', ');
    logInfo(
      `Processing logout request: found ${cookies.length} cookies with names: ${cookieNames} and tokenRaw: ${tokenRaw}`,
    );
    const useSecureCookie = env.nextauthUrl.startsWith('https://');
    const token = await getToken({ req, secret: env.authSecret, secureCookie: useSecureCookie });
    if (token) {
      return redirectToIDP(token);
    }
    return handleEmptyToken();
  } catch (error) {
    logError('Error during logout', error);
  }
  return NextResponse.redirect(env.nextauthUrl);
}
