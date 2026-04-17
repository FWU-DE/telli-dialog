import { z } from 'zod';

export const DesignConfigurationSchema = z.object({
  primaryColor: z.string(),
  primaryTextColor: z.string(),
  secondaryColor: z.string(),
  secondaryTextColor: z.string(),
});

export type DesignConfiguration = z.infer<typeof DesignConfigurationSchema>;
