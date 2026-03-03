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

interface CachedDiscoveryDocument {
  body: string;
  status: number;
  headers: Record<string, string>;
}

let cachedDiscoveryDocument: CachedDiscoveryDocument | undefined;
let cacheExpiresAt = 0;
let inFlightDiscoveryRequest: Promise<Response> | undefined;

function resolveUrl(input: Parameters<typeof fetch>[0]): URL {
  if (input instanceof Request) {
    return new URL(input.url);
  }
  if (input instanceof URL) {
    return input;
  }
  const inputStr = String(input);
  try {
    return new URL(inputStr);
  } catch {
    return new URL(inputStr, env.vidisIssuerUri);
  }
}

function buildResponseFromCache(cached: CachedDiscoveryDocument): Response {
  return new Response(cached.body, {
    status: cached.status,
    headers: cached.headers,
  });
}

/**
 * Custom fetch that caches the OIDC discovery document (.well-known/openid-configuration).
 * All other requests are passed through to the standard fetch.
 *
 * Without caching, auth.js fetches the discovery document on every auth operation,
 * which can take 200ms–10s depending on the VIDIS server response time.
 *
 * Concurrent requests share the same in-flight promise to avoid duplicate upstream calls.
 * The cached data is stored as parsed JSON (not a Response object) for cross-runtime safety.
 */
async function cachedDiscoveryFetch(...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
  const url = resolveUrl(args[0]);

  if (!url.pathname.endsWith('/.well-known/openid-configuration')) {
    return fetch(...args);
  }

  if (cachedDiscoveryDocument && Date.now() < cacheExpiresAt) {
    logDebug('Using cached OIDC discovery document');
    return buildResponseFromCache(cachedDiscoveryDocument);
  }

  if (inFlightDiscoveryRequest) {
    logDebug('Awaiting in-flight OIDC discovery request');
    return inFlightDiscoveryRequest.then((r) => r.clone());
  }

  logDebug('Fetching OIDC discovery document');
  inFlightDiscoveryRequest = fetch(...args);

  try {
    const response = await inFlightDiscoveryRequest;

    if (response.ok) {
      const body = await response.text();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      cachedDiscoveryDocument = { body, status: response.status, headers };
      cacheExpiresAt = Date.now() + OIDC_CONFIG_CACHE_TTL_MS;
      return buildResponseFromCache(cachedDiscoveryDocument);
    }

    return response;
  } finally {
    inFlightDiscoveryRequest = undefined;
  }
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
