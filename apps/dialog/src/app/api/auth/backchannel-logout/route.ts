import { deleteSession } from '@/auth/session';
import { logError, logWarning } from '@/utils/logging/logging';
import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract the logout_token from the request body
 * @param req
 * @returns logout_token as string or null if not found
 */
async function getLogoutTokenFromRequest(req: NextRequest) {
  const bodyText = await req.text();
  const params = new URLSearchParams(bodyText);
  return params.get('logout_token');
}

/**
 * Handle POST requests for backchannel logout.
 * If a user logs out from another client, the IDP will send a POST request to this endpoint.
 * The body must contain a logout_token as string which contains the session id (sid).
 * @param req
 * @returns
 */
export async function POST(req: NextRequest) {
  try {
    const logoutToken = await getLogoutTokenFromRequest(req);
    if (!logoutToken) {
      logWarning('No logout_token found in request body');
      return NextResponse.json({ error: 'No logout_token found in request body' }, { status: 400 });
    }

    const decodedToken = jose.decodeJwt(logoutToken);
    const sessionId = decodedToken.sid as string;
    if (!sessionId) {
      logWarning('No sid found in logout_token');
      return NextResponse.json({ error: 'No sid found in logout_token' }, { status: 400 });
    }

    await deleteSession(sessionId);
    return new Response('OK', { status: 200 });
  } catch (error) {
    logError('Error processing backchannel logout', error);
    return NextResponse.json({ error: 'Error processing backchannel logout' }, { status: 500 });
  }
}
