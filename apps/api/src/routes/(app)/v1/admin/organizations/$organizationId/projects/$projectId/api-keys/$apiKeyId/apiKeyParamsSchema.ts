import z from 'zod';
import { projectParamsSchema } from '../../projectParamsSchema';

export const apiKeyParamsSchema = projectParamsSchema.extend({
  apiKeyId: z.string().uuid(),
});
