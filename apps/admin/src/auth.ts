import NextAuth, { NextAuthResult } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { env } from '@/consts/env';

declare module 'next-auth' {
  interface Session {
    idToken?: string; // needed for logout at identity provider (keycloak)
  }
}

// Default provider for stage and prod
const keycloakProvider = KeycloakProvider({
  // https://next-auth.js.org/configuration/providers/oauth#userinfo-option
  idToken: true, // preferred way to get some user information, otherwise an additional request is send
  clientId: env.keycloakClientId,
  clientSecret: env.keycloakClientSecret,
  issuer: env.keycloakIssuer,
});

const result = NextAuth({
  providers: [keycloakProvider],
  trustHost: true,
  callbacks: {
    async signIn() {
      return true;
    },
    async authorized({ auth }) {
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth;
    },
    async jwt({ token, account }) {
      // Capture idToken from account during sign-in
      if (account?.id_token) {
        token.id_token = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass idToken from token to session for logout flow
      if (token?.id_token) {
        session.idToken = token.id_token as string;
      }
      return session;
    },
  },
});

export const handlers: NextAuthResult['handlers'] = result.handlers;
export const auth: NextAuthResult['auth'] = result.auth;
export const signIn: NextAuthResult['signIn'] = result.signIn;
export const signOut: NextAuthResult['signOut'] = result.signOut;
