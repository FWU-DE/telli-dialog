import { getBaseUrlByHeaders } from '@/utils/host';
import { dbGetOrCreateVidisUser } from '@/db/functions/vidis';
import { env } from '@/env';
import { Account, NextAuthConfig, Profile } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { z } from 'zod';

export const oAuthTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.coerce.number(),
  id_token: z.string(),
  scope: z.string(),
  token_type: z.string(),
});

export const vidisUserInfoSchema = z.object({
  sub: z.string(),
  rolle: z.string(),
  schulkennung: z.string().or(z.array(z.string())),
  bundesland: z.string(),
});
export type VidisUserInfo = z.infer<typeof vidisUserInfoSchema>;

export const signInVidisSchema = vidisUserInfoSchema.and(oAuthTokenResponseSchema);

const vidisAccountSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  // refresh_expires_in: z.number(),
  // refresh_token: z.string(),
  // session_state: z.string(),
  token_type: z.literal('bearer'),
  id_token: z.string(),
  provider: z.literal('vidis'),
});

const vidisProfileSchema = z.object({
  exp: z.number(),
  iat: z.number(),
  // auth_time: z.number(),
  // jti: z.string(),
  iss: z.string(),
  aud: z.string(),
  sub: z.string(),
  // typ: z.literal('ID'),
  // azp: z.string(),
  // session_state: z.string(),
  at_hash: z.string(),
  // email: z.string(),
  // sid: z.string(),
  rolle: z.string(),
  schulkennung: z.string().or(z.array(z.string())),
  bundesland: z.string(),
});

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
    return null;
  }

  token.userId = createdUser.id;
  token.email = createdUser.email;
  token.id_token = parsedAccount.id_token;
  return token;
}

export async function handleVidisLogout({ idToken }: { idToken: string }) {
  console.info('Performing logout handshare with vidis');
  const searchParams = new URLSearchParams({
    post_logout_redirect_uri: (await getBaseUrlByHeaders()) ?? 'chat.telli.schule',
    id_token_hint: idToken,
  });
  const response = await fetch(
    `${env.vidisIssuerUri}/protocol/openid-connect/logout?${searchParams.toString()}`,
  );
  if (!response.ok) {
    console.error({ error: await response.text() });
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
} satisfies NextAuthConfig['providers'][number];
