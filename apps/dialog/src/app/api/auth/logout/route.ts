import { env } from '@/env';
import { logError, logWarning } from '@/utils/logging/logging';
import { getToken, JWT } from 'next-auth/jwt';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

const LOGIN_PAGE = new URL('/login', env.nextauthUrl);
const LOGOUT_FINISHED_URL = new URL('/logout-finished', env.nextauthUrl);
const VIDIS_LOGOUT_URL = new URL('/protocol/openid-connect/logout', env.vidisIssuerUri);

function handleEmptyToken() {
  logWarning('No valid token found, redirecting to login page');
  return NextResponse.redirect(LOGIN_PAGE);
}

function redirectToIDP(token: JWT) {
  const logoutUrl = new URL(VIDIS_LOGOUT_URL);
  logoutUrl.searchParams.append('id_token_hint', token.id_token as string);
  logoutUrl.searchParams.append('post_logout_redirect_uri', LOGOUT_FINISHED_URL.toString());
  return NextResponse.redirect(logoutUrl);
}

/**
 * Route to handle logout.
 * If a valid JWT token is available, we redirect to the IDP to logout current session.
 * If no token is available, we simply redirect to the login page.
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: env.authSecret });
    if (token) {
      return redirectToIDP(token);
    }
    return handleEmptyToken();
  } catch (error) {
    logError('Error during logout', error);
  }
  return redirect(env.nextauthUrl);
}
