import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Provider } from 'next-auth/providers/index';
import { isDevelopment } from '../../../../utils';

// Default provider for stage and prod
const keycloakProvider: Provider = KeycloakProvider({
  // https://next-auth.js.org/configuration/providers/oauth#userinfo-option
  idToken: true, // preferred way to get some user information, otherwise an additional request is send
  clientId: process.env.KEYCLOAK_CLIENT_ID || '',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  issuer: process.env.KEYCLOAK_ISSUER || '',
});

// Development only provider
const credentialsProvider = CredentialsProvider({
  name: 'Credentials',
  credentials: {
    username: {
      label: 'Username',
      type: 'text',
      placeholder: 'jsmith',
    },
    password: { label: 'Password', type: 'password' },
  },
  async authorize() {
    return {
      id: '1',
      name: 'J Smith',
      email: 'jsmith@example.com',
    };
  },
});

const providers = [keycloakProvider, ...(isDevelopment() ? [credentialsProvider] : [])];

export const authOptions = {
  providers: providers,
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
