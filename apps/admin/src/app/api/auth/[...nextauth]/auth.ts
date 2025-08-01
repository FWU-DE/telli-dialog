import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

export const nextAuthOptions = {
  providers: [
    KeycloakProvider({
      // https://next-auth.js.org/configuration/providers/oauth#userinfo-option
      idToken: true, // preferred way to get some user information, otherwise an additional request is send
      clientId: process.env.KEYCLOAK_CLIENT_ID || '',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
      issuer: process.env.KEYCLOAK_ISSUER || '',
    }),
  ],
} satisfies NextAuthOptions;

// Use this function in server contexts
export function auth(
  ...args:
    | [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, nextAuthOptions);
}
