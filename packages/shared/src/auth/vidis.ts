import z from 'zod';

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

export const vidisAccountSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  // refresh_expires_in: z.number(),
  // refresh_token: z.string(),
  // session_state: z.string(),
  token_type: z.literal('bearer'),
  id_token: z.string(),
  provider: z.literal('vidis').or(z.literal('vidis-mock')),
});

export const vidisProfileSchema = z.object({
  exp: z.number(),
  iat: z.number(),
  // auth_time: z.number(),
  // jti: z.string(),
  iss: z.string(),
  aud: z.string(),
  sub: z.string(), // subject - user id
  // typ: z.literal('ID'),
  // azp: z.string(),
  // session_state: z.string(),
  // at_hash: z.string(),
  // email: z.string(),
  sid: z.string(), // session id
  is_ai_chat_eligible: z.boolean().optional(),
  rolle: z.string(),
  schulkennung: z.string().or(z.array(z.string())),
  bundesland: z.string(),
});
