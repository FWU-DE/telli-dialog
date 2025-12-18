import { LOGIN_PAGE_URL } from '@/app/(unauth)/login/const';
import { logError } from '@shared/logging';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'authjs.session-token';
const SECURE_SESSION_COOKIE_NAME = `__Secure-${SESSION_COOKIE_NAME}`; // Used when site is served over HTTPS

/**
 * This route is called by the IDP after logout.
 * We clear the session cookies and redirect to the login page.
 * If the session cookie is bigger than 4 kb, the cookie might be split into multiple cookies.
 * Therefore, we clear all cookies that start with the session cookie name.
 */
export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.redirect(LOGIN_PAGE_URL);
    const cookieNames = request.cookies
      .getAll()
      .map((cookie) => cookie.name)
      .filter(
        (name) =>
          name.startsWith(SESSION_COOKIE_NAME) || name.startsWith(SECURE_SESSION_COOKIE_NAME),
      );

    cookieNames.forEach((cookieName) => {
      response.cookies.set(cookieName, '', {
        path: '/',
        maxAge: 0,
        secure: cookieName.startsWith('__Secure-'),
      });
    });

    return response;
  } catch (error) {
    logError('Error during logout-callback', error);
    return NextResponse.redirect(LOGIN_PAGE_URL);
  }
}
