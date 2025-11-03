import { z } from 'zod';

export const DesignConfigurationSchema = z.object({
  primaryColor: z.string(),
  primaryTextColor: z.string(),
  secondaryColor: z.string(),
  secondaryTextColor: z.string(),
  secondaryDarkColor: z.string(),
  secondaryLightColor: z.string(),
  primaryHoverColor: z.string(),
  primaryHoverTextColor: z.string(),
  chatMessageBackgroundColor: z.string(),
  buttonPrimaryTextColor: z.string(),
});

export type DesignConfiguration = z.infer<typeof DesignConfigurationSchema>;
