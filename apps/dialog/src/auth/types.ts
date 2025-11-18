import {
  federalStateSelectSchema,
  schoolSelectSchema,
  userSchoolRoleSchema,
  userSelectSchema,
} from '@shared/db/schema';
import z from 'zod';

const obscuredFederalStateSchema = federalStateSelectSchema.omit({ encryptedApiKey: true });
const userSchoolSchema = schoolSelectSchema.extend({
  userRole: userSchoolRoleSchema,
});

export const userAndContextSchema = userSelectSchema.extend({
  school: userSchoolSchema,
  federalState: obscuredFederalStateSchema,
  hasApiKeyAssigned: z.boolean(),
});

export type UserAndContext = z.infer<typeof userAndContextSchema>;
