import NextAuth, { NextAuthResult } from 'next-auth';
import { vidisConfig, handleVidisJWTCallback } from './providers/vidis';
import { mockVidisConfig } from './providers/vidis-mock';
import { credentialsProvider } from './providers/credentials';
import { getUserAndContextByUserId } from './utils';
import { UserAndContext } from './types';
import { logDebug, logError } from '@/utils/logging/logging';

// TODO: Move this to it's own file (see also: https://github.com/nextauthjs/next-auth/discussions/9120#discussioncomment-7544307)
declare module 'next-auth' {
  interface Session {
    user?: UserAndContext;
  }
}

const SESSION_LIFETIME = 60 * 60 * 8;

const result = NextAuth({
  providers: [vidisConfig, mockVidisConfig, credentialsProvider],
  jwt: {
    maxAge: SESSION_LIFETIME,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_LIFETIME,
  },
  trustHost: true,
  // https://next-auth.js.org/configuration/callbacks
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      logDebug(
        `signIn callback triggered: ${user}, ${account}, ${profile}, ${email}, ${credentials}`,
      );
      // account contains access_token, refresh_token, id_token, expires_in, session_state, etc.
      // profile contains user profile (if available) like name, preferred_username, given_name, family_name, email, bundesland, rolle, schulkennung, etc.
      // user contains id, name, email
      // all props are only passed the first time a user signs in, subsequent calls only provide a token

      // Todo: we should check if custom attributes like bundesland are provided and return false if not
      return true;
    },
    async jwt({ token, account, profile, trigger, user }) {
      // this callback is called when a JSON Web Token is created (i.e. at sign in and when the session is accessed in the client)
      // account contains access_token, refresh_token, id_token, expires_in, session_state, etc.
      // profile contains user profile (if available) like name, preferred_username, given_name, family_name, email, etc.
      // user contains id, name, email
      logDebug(`jwt callback triggered: ${token}, ${account}, ${profile}, ${trigger}, ${user}`);
      try {
        if (
          trigger === 'signIn' &&
          (account?.provider === 'vidis' || account?.provider === 'vidis-mock') &&
          profile !== undefined
        ) {
          // This function can throw an error if the return type does not match our schema
          token = await handleVidisJWTCallback({ account, profile, token });
        }
        // Ensure userId is set for credentials provider
        if (account?.provider === 'credentials' && user?.id) {
          token.userId = user.id;
        }
        if (trigger === 'update') {
          token.user = await getUserAndContextByUserId({ userId: token.userId as string });
        }
        // Todo: that function is called very often so we should not make database calls here --> check token.user and token.school
        if (token.user === undefined || (token.user as UserAndContext).school === undefined) {
          token.user = await getUserAndContextByUserId({ userId: token.userId as string });
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
      logDebug(`session callback triggered: ${session}, ${token}`);

      const userId = token.userId;
      if (userId === undefined || userId === null) return session;

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
    async signIn(message) {
      logDebug(`signIn event triggered: ${message}`);
    },
    async signOut(message) {
      logDebug(`signOut event triggered: ${message}`);
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
