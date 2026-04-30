import z from 'zod';

export const vidisUserInfoSchema = z.object({
  sub: z.string(),
  rolle: z.string(),
  schulkennung: z.string().or(z.array(z.string())),
  bundesland: z.string(),
});
export type VidisUserInfo = z.infer<typeof vidisUserInfoSchema>;

// Schema for the user object provided by vidis authentication provider
// It contains only the fields we need
export const vidisUserSchema = z.object({
  id: z.string(),
});

// Schema for the account object provided by vidis authentication provider
// It contains only the fields that are mandatory for the application
export const vidisAccountSchema = z.object({
  token_type: z.literal('bearer'), // we only support bearer tokens
  id_token: z.string(), // is needed for logout
  provider: z.literal('vidis'), // we only support vidis as provider
  type: z.literal('oidc'), // we only support oidc
});

// Schema for the profile object provided by vidis authentication provider
// It contains only fields that are mandatory for the application
export const vidisProfileSchema = z.object({
  sub: z.string(), // subject - user id
  sid: z.string(), // session id
  is_ai_chat_eligible: z.boolean().optional(),
  rolle: z.string(),
  schulkennung: z.string().or(z.array(z.string())),
  bundesland: z.string(),
  // name, preferred_username, given_name, family_name and email are ignored because of data privacy
});

export type VidisProfile = z.infer<typeof vidisProfileSchema>;
