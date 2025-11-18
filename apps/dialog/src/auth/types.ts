import {
  federalStateSelectSchema,
  schoolSelectSchema,
  userSchoolRoleSchema,
} from '@shared/db/schema';
import z from 'zod';

const obscuredFederalStateSchema = federalStateSelectSchema.omit({ encryptedApiKey: true });
const userSchoolSchema = schoolSelectSchema.extend({
  userRole: userSchoolRoleSchema,
});

export const userAndContextSchema = z.object({
  school: userSchoolSchema,
  federalState: obscuredFederalStateSchema,
  hasApiKeyAssigned: z.boolean(),
});

export type UserAndContext = z.infer<typeof userAndContextSchema>;
