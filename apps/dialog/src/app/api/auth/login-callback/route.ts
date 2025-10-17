import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * This route is called as callback uri after successful login from client.
 * It stores a simple cookie with the session id that is used by the middleware
 * to validate the session on each request.
 * */
export async function GET() {
  const session = await auth();

  if (session?.sessionId) {
    const cookieStore = await cookies();
    cookieStore.set('telli-session-id', session.sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  redirect('/');
}
