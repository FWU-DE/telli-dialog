import { NextAuthConfig } from 'next-auth';

// const BASE_URL = 'http://localhost:9000';
const BASE_URL = 'https://titanom.ngrok.app';

export const mockVidisConfig = {
  id: 'vidis-mock',
  name: 'vidis-mock',
  type: 'oidc',
  wellKnown: `${BASE_URL}/.well-known/openid-configuration`,
  authorization: { params: { scope: 'openid' } },
  idToken: true,
  checks: ['pkce', 'state'],
  clientId: 'vidis-client',
  clientSecret: 'vidis-secret',
  issuer: BASE_URL,
} satisfies NextAuthConfig['providers'][number];
