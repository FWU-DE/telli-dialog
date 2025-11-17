import { federalStateSelectSchema } from '@shared/db/schema';
import { z } from 'zod';

export const federalStateSchema = federalStateSelectSchema
  .omit({
    encryptedApiKey: true,
  })
  .extend({
    hasApiKeyAssigned: z.boolean(),
  });

export type FederalStateModel = z.infer<typeof federalStateSchema>;
