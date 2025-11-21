import { z } from 'zod';

export const apiKeySchema = z.object({
  id: z.string().uuid().readonly(),
  name: z.string().nonempty(),
  projectId: z.string().nonempty(),
  state: z.literal('active').or(z.literal('inactive')).or(z.literal('deleted')),
  limitInCent: z.number().nonnegative(),
  createdAt: z.date().readonly(),
  expiresAt: z.date().optional(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;

export const apiKeyWithPlainKeySchema = apiKeySchema.extend({
  plainKey: z.string(),
});

export type ApiKeyWithPlainKey = z.infer<typeof apiKeyWithPlainKeySchema>;

export const createApiKeySchema = z.object({
  name: z.string().nonempty(),
  state: z.literal('active').or(z.literal('inactive')).or(z.literal('deleted')).optional(),
  limitInCent: z.number().nonnegative().optional(),
  expiresAt: z.date().nullable().optional(),
});

export type CreateApiKey = z.infer<typeof createApiKeySchema>;

export const updateApiKeySchema = z.object({
  name: z.string().nonempty(),
  state: z.literal('active').or(z.literal('inactive')).or(z.literal('deleted')).optional(),
  limitInCent: z.number().nonnegative().optional(),
  expiresAt: z.date().nullable().optional(),
});

export type UpdateApiKey = z.infer<typeof updateApiKeySchema>;
