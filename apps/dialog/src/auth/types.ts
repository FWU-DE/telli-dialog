import { userSchema } from '@shared/auth/user-model';
import { federalStateSelectSchema } from '@shared/db/schema';
import { z } from 'zod';

const obscuredFederalStateSchema = federalStateSelectSchema.omit({
  encryptedApiKey: true,
  apiKeyId: true,
});

export const userAndContextSchema = userSchema.extend({
  federalState: obscuredFederalStateSchema,
  hasApiKeyAssigned: z.boolean(),
});

export type UserAndContext = z.infer<typeof userAndContextSchema>;
