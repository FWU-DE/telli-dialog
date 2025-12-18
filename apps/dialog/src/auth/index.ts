import NextAuth, { NextAuthResult } from 'next-auth';
import { vidisConfig, handleVidisJWTCallback } from './providers/vidis';
import { getUserAndContextByUserId } from './utils';
import { UserAndContext, userAndContextSchema } from './types';
import { logError, logInfo, logWarning } from '@shared/logging';
import { sessionBlockList } from './session';

declare module 'next-auth' {
  interface Session {
    user?: UserAndContext;
    hasCompletedTraining?: boolean;
    sessionId?: string; // identifies the session for blocking list after backchannel logout
    idToken?: string; // needed for logout at identity provider (vidis)
  }
}

const SESSION_LIFETIME_SECONDS = 60 * 60 * 8;

const result = NextAuth({
  providers: [vidisConfig],
  jwt: {
    maxAge: SESSION_LIFETIME_SECONDS,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_LIFETIME_SECONDS,
  },
  trustHost: true,
  // https://next-auth.js.org/configuration/callbacks
  callbacks: {
    async signIn() {
      // all props are only passed the first time a user signs in, subsequent calls only provide a token
      // Todo: we should check if custom attributes like bundesland are provided and return false if not
      return true;
    },
    async jwt({ token, account, profile, trigger }) {
      // this callback is called when a JSON Web Token is created, updated or accessed in backend
      // returning null will invalidate the token and end the session
      try {
        if (trigger === 'signIn' && account?.provider === 'vidis' && profile !== undefined) {
          // This function can throw an error if the return type does not match our schema
          token = await handleVidisJWTCallback({ account, profile, token });
        }

        const result = userAndContextSchema.safeParse(token.user);
        if (token.user && !result.success) {
          logWarning(
            'Parsing the user from token failed. This is expected when the schema was changed due to a software update.',
            { result },
          );
        }

        // Update session data if there is an update or the structure has changed
        if (trigger === 'update' || !result.success) {
          token.user = await getUserAndContextByUserId({ userId: token.userId as string });
        }

        if (profile?.sid) {
          token.sessionId = profile.sid;
        }
        if (token.sessionId) {
          if (await sessionBlockList.has(token.sessionId as string)) {
            logInfo('Session is blocked, returning null token');
            return null;
          }
        }
        return token;
      } catch (error) {
        logError('Error in JWT callback', error);
        return null;
      }
    },
    async session({ session, token }) {
      // This callback is called whenever a session is checked (i.e. on the client)
      // in order to pass properties to the client, copy them from token to the session

      if (token?.sessionId) session.sessionId = token.sessionId as string;
      if (token?.id_token) session.idToken = token.id_token as string;

      const userId = token.userId;
      if (userId === undefined || userId === null) return session;

      session.hasCompletedTraining = (token.hasCompletedTraining as boolean) ?? false;

      if (session?.user?.id === undefined) {
        session.user = {
          ...session.user,
          ...(token.user as UserAndContext),
        };
      }

      return session;
    },
  },
  // https://next-auth.js.org/configuration/events
  // Events should only be used for instrumentation
  events: {
    async signIn() {
      /* raise custom metric here as soon as we have one */
    },
    async signOut() {
      /* raise custom metric here as soon as we have one */
    },
  },
});

export const handlers: NextAuthResult['handlers'] = result.handlers;
export const auth: NextAuthResult['auth'] = result.auth;
export const signIn: NextAuthResult['signIn'] = result.signIn;
export const signOut: NextAuthResult['signOut'] = result.signOut;
// This seems to currently be the only option for server-side updates to the session/jwt.
// Client side use useSession().update()
export const unstable_update: NextAuthResult['unstable_update'] = result.unstable_update;
