import { dbGetOrCreateVidisUser } from '@telli/shared/db/functions/vidis';
import { env } from '@/env';
import { Account, NextAuthConfig, Profile } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { vidisAccountSchema, vidisProfileSchema } from '@telli/shared/types/vidis';

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
