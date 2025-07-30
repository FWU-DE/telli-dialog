
import { z } from 'zod';

export const formLinks = z.array(
  z.object({
    type: z.literal('websearch'),
    name: z.string().optional(),
    link: z.string(),
    content: z.string().optional(),
    hostname: z.string().optional(),
    error: z.boolean().optional(),
  })
);