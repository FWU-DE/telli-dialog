import NextAuth, { NextAuthResult } from 'next-auth';
import { vidisConfig, handleVidisJWTCallback, handleVidisLogout } from './providers/vidis';
import { mockVidisConfig } from './providers/vidis-mock';
import { credentialsProvider } from './providers/credentials';
import { getUserAndContextByUserId } from './utils';
import { UserAndContext } from './types';
import { dbUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';

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
  callbacks: {
    async jwt({ token, account, profile, trigger, user }) {
      if (
        trigger === 'signIn' &&
        (account?.provider === 'vidis' || account?.provider === 'vidis-mock') &&
        profile !== undefined
      ) {
        token = await handleVidisJWTCallback({ account, profile, token });
      }
      // Ensure userId is set for credentials provider
      if (account?.provider === 'credentials' && user?.id) {
        token.userId = user.id;
      }
      if (trigger === 'update') {
        token.user = await getUserAndContextByUserId({ userId: token.userId as string });
      }
      if (token.user === undefined || (token.user as UserAndContext).school === undefined) {
        const userAndContext = await getUserAndContextByUserId({ userId: token.userId as string });
        token.user = userAndContext;
        dbUpdateLlmModelsByFederalStateId({ federalStateId: userAndContext.federalState?.id });
      }
      return token;
    },
    async session({ session, token }) {
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
  events: {
    async signOut(message) {
      if ('session' in message) return;

      const token = message.token;

      if (token === null) return;

      const maybeIdToken = token.id_token as string | undefined;

      if (maybeIdToken !== undefined) {
        await handleVidisLogout({ idToken: maybeIdToken });
      }

      return undefined;
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
