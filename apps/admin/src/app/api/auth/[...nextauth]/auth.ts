import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { Provider } from 'next-auth/providers/index';
import { env } from '@/consts/env';

// Default provider for stage and prod
const keycloakProvider: Provider = KeycloakProvider({
  // https://next-auth.js.org/configuration/providers/oauth#userinfo-option
  idToken: true, // preferred way to get some user information, otherwise an additional request is send
  clientId: env.keycloakClientId,
  clientSecret: env.keycloakClientSecret,
  issuer: env.keycloakIssuer,
});

export const authOptions = {
  providers: [keycloakProvider],
} satisfies NextAuthOptions;

// Use this function in server contexts
export function auth(
  ...args:
    | [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, authOptions);
}
