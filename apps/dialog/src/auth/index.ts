import NextAuth from 'next-auth';
import { vidisConfig, handleVidisJWTCallback, handleVidisLogout } from './providers/vidis';
import { dbGetUserById } from '@/db/functions/user';
import { mockVidisConfig } from './providers/vidis-mock';

const SESSION_LIFETIME = 60 * 60 * 8;

console.log('Authentication: ', process.env.VIDIS_ISSUER_URI);
console.log('Client ID: ', process.env.VIDIS_CLIENT_ID);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [vidisConfig, mockVidisConfig],
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
