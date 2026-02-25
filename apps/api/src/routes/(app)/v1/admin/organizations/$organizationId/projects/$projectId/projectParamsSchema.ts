import z from 'zod';
import { organizationParamsSchema } from '../../organizationParamsSchema';

export const projectParamsSchema = organizationParamsSchema.extend({
  projectId: z.string(),
});
