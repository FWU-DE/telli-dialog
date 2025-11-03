import { auth } from '@/auth';
import { logError, logInfo, logWarning } from '@/utils/logging/logging';
import { NextResponse } from 'next/server';
import { LOGOUT_CALLBACK_URL } from '../const';
import { VIDIS_LOGOUT_URL } from '@/auth/providers/vidis';
import { LOGIN_PAGE_URL } from '@/app/(unauth)/login/page';

function handleEmptyToken() {
  logWarning('No valid token found, redirecting to logout-callback url');
  return NextResponse.redirect(LOGOUT_CALLBACK_URL);
}

function redirectToIDP(idToken: string) {
  logInfo('Redirect to IDP with token for logout');
  const logoutUrl = new URL(VIDIS_LOGOUT_URL); // create a new URL object to avoid mutating the existing one
  logoutUrl.searchParams.append('id_token_hint', idToken);
  logoutUrl.searchParams.append('post_logout_redirect_uri', LOGOUT_CALLBACK_URL.toString());
  return NextResponse.redirect(logoutUrl);
}

/**
 * Route to handle logout.
 * If a valid JWT token is available, we redirect to the IDP to logout current session.
 * If no token is available, we simply redirect to the logout_callback url for cleanup.
 */
export async function GET() {
  try {
    const session = await auth();
    if (session?.idToken) return redirectToIDP(session?.idToken);
    return handleEmptyToken();
  } catch (error) {
    logError('Error during logout', error);
    return NextResponse.redirect(LOGIN_PAGE_URL);
  }
}
