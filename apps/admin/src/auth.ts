import NextAuth, { NextAuthResult } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { env } from '@/consts/env';

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
  debug: true,
  callbacks: {
    async signIn() {
      return true;
    },
    async authorized({ auth }) {
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth;
    },
    async jwt({ token, account, profile, trigger, user }) {
      return token;
    },
    async session({ session }) {
      return session;
    },
  },
});

export const handlers: NextAuthResult['handlers'] = result.handlers;
export const auth: NextAuthResult['auth'] = result.auth;
export const signIn: NextAuthResult['signIn'] = result.signIn;
export const signOut: NextAuthResult['signOut'] = result.signOut;
