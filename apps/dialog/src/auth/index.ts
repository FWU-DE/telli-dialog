import NextAuth, { NextAuthResult } from 'next-auth';
import { vidisConfig, handleVidisJWTCallback, handleVidisLogout } from './providers/vidis';
import { dbGetUserById } from '@/db/functions/user';
import { mockVidisConfig } from './providers/vidis-mock';
import CredentialsProvider from 'next-auth/providers/credentials';

const SESSION_LIFETIME = 60 * 60 * 8;

const result = NextAuth({
  providers: [
    vidisConfig,
    mockVidisConfig,
    CredentialsProvider({
      name: 'Test Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.username === 'test' && credentials?.password === 'test') {
          return {
            id: 'testuser',
            email: 'testuser@example.com',
            name: 'Test User',
            rolle: 'LEHR',
            schulkennung: 'Test-Schule',
            bundesland: 'DE-TEST',
          };
        }
        return null;
      },
    }),
  ],
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
    async jwt({ token, account, profile, trigger }) {
      if (
        trigger === 'signIn' &&
        (account?.provider === 'vidis' || account?.provider === 'vidis-mock') &&
        profile !== undefined
      ) {
        return await handleVidisJWTCallback({ account, profile, token });
      }
      return token;
    },
    async session({ session, token }) {
      const userId = token.userId;
      if (userId === undefined || userId === null) return session;

      const user = await dbGetUserById({ userId: userId as string });

      if (user === undefined) {
        throw Error(`Could not find user with id ${userId}`);
      }
      // @ts-expect-error some weird next-auth typing error
      session.user = user;
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
