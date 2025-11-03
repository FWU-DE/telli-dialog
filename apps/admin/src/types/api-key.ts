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
