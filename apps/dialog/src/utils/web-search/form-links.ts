import { WebsearchSource } from '@shared/db/types';
import { z } from 'zod';

const websearchSourceSchema = z.object({
  name: z.string().optional(),
  link: z.string(),
  content: z.string().optional(),
  error: z.boolean().optional(),
}) satisfies z.ZodType<WebsearchSource>;

export const formLinks = z.array(websearchSourceSchema);
