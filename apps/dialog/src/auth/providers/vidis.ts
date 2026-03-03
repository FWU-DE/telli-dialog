import { dbGetOrCreateVidisUser } from '@telli/shared/db/functions/vidis';
import { env } from '@/env';
import { Account, NextAuthConfig, Profile } from 'next-auth';
import { customFetch } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { vidisAccountSchema, vidisProfileSchema } from '@telli/shared/auth/vidis';
import { logDebug } from '@shared/logging';

export const VIDIS_LOGOUT_URL = new URL(env.vidisIssuerUri + '/protocol/openid-connect/logout');

export async function handleVidisJWTCallback({
  profile,
  token,
  account,
}: {
  profile: Profile;
  token: JWT;
  account: Account;
}) {
  const parsedProfile = vidisProfileSchema.parse(profile);
  const parsedAccount = vidisAccountSchema.parse(account);

  const createdUser = await dbGetOrCreateVidisUser({ ...parsedProfile });

  if (createdUser === undefined) {
    throw Error('Could not create user');
  }

  token.userId = createdUser.id;
  token.email = createdUser.email;
  token.id_token = parsedAccount.id_token;
  token.hasCompletedTraining = parsedProfile.is_ai_chat_eligible ?? false;
  return token;
}

const OIDC_CONFIG_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedOidcResponse: Response | undefined;
let cacheExpiresAt = 0;

/**
 * Custom fetch that caches the OIDC discovery document (.well-known/openid-configuration).
 * All other requests are passed through to the standard fetch.
 *
 * Without caching, auth.js fetches the discovery document on every auth operation,
 * which can take 200ms–10s depending on the VIDIS server response time.
 */
async function cachedDiscoveryFetch(...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
  const url = new URL(args[0] instanceof Request ? args[0].url : args[0]);

  if (!url.pathname.endsWith('/.well-known/openid-configuration')) {
    return fetch(...args);
  }

  if (cachedOidcResponse && Date.now() < cacheExpiresAt) {
    logDebug('Using cached OIDC discovery document');
    return cachedOidcResponse.clone();
  }

  logDebug('Fetching OIDC discovery document');
  const response = await fetch(...args);

  if (response.ok) {
    cachedOidcResponse = response.clone();
    cacheExpiresAt = Date.now() + OIDC_CONFIG_CACHE_TTL_MS;
  }

  return response;
}

export const vidisConfig = {
  id: 'vidis',
  name: 'vidis',
  type: 'oidc',
  wellKnown: `${env.vidisIssuerUri}/.well-known/openid-configuration`,
  authorization: { params: { scope: 'openid' } },
  idToken: true,
  checks: ['pkce', 'state'],
  clientId: env.vidisClientId,
  clientSecret: env.vidisClientSecret,
  issuer: env.vidisIssuerUri,
  [customFetch]: cachedDiscoveryFetch,
} satisfies NextAuthConfig['providers'][number];
