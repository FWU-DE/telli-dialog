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

export const createApiKeySchema = apiKeySchema
  .pick({
    name: true,
    state: true,
    limitInCent: true,
    expiresAt: true,
  })
  .partial({
    state: true,
    limitInCent: true,
    expiresAt: true,
  });

export type CreateApiKey = z.infer<typeof createApiKeySchema>;

export const updateApiKeySchema = apiKeySchema
  .pick({
    name: true,
    state: true,
    limitInCent: true,
    expiresAt: true,
  })
  .partial({
    state: true,
    limitInCent: true,
    expiresAt: true,
  });

export type UpdateApiKey = z.infer<typeof updateApiKeySchema>;
