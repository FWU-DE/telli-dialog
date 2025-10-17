import { env } from '@/env';
import { logError, logInfo } from '@/utils/logging/logging';
import { NextResponse } from 'next/server';

const LOGIN_PAGE = new URL('login', env.nextauthUrl);
const SESSION_COOKIE_NAME = 'authjs.session-token';
const SECURE_SESSION_COOKIE_NAME = `__Secure-${SESSION_COOKIE_NAME}`; // Used when site is served over HTTPS

/**
 * This route is called by the IDP after logout.
 * We clear the session cookies and redirect to the login page.
 */
export async function GET() {
  try {
    const response = NextResponse.redirect(LOGIN_PAGE);
    response.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    response.cookies.set(SECURE_SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    logInfo('logout-callback: returning redirect to login page and deleted session cookie');
    return response;
  } catch (error) {
    logError('Error during logout-callback', error);
    return NextResponse.error();
  }
}
