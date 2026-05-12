import { WebSource } from '@shared/db/types';
import { z } from 'zod';

const webSourceSchema = z.object({
  name: z.string().optional(),
  link: z.string(),
  content: z.string().optional(),
  error: z.boolean().optional(),
}) satisfies z.ZodType<WebSource>;

export const formLinks = z.array(webSourceSchema);
