import { UserModel } from '@shared/auth/user-model';
import {
  federalStateSelectSchema,
  SchoolModel,
  schoolSelectSchema,
  userSchoolRoleSchema,
  userSelectSchema,
} from '@shared/db/schema';
import { FederalStateModel } from '@shared/federal-states/types';
import { z } from 'zod';

const obscuredFederalStateSchema = federalStateSelectSchema.omit({
  encryptedApiKey: true,
  apiKeyId: true,
});
const userSchoolSchema = schoolSelectSchema.extend({
  userRole: userSchoolRoleSchema,
});

export const userAndContextSchema = userSelectSchema.extend({
  school: userSchoolSchema,
  federalState: obscuredFederalStateSchema,
  hasApiKeyAssigned: z.boolean(),
});

export type UserAndContext = z.infer<typeof userAndContextSchema>;

/**
 * This function is used to build a legacy UserAndContext object from separate user, school, and federalState models.
 * It combines the data from these models into a single object that conforms to the UserAndContext schema.
 * firstName, lastName and email are set to empty strings as they are not provided by the Identity Providers.
 * Even if we get these fields, we never make use of them.
 * As soon as we have removed all legacy usages of UserAndContext, this function and the type can be removed.
 */
export function buildLegacyUserAndContext(
  user: UserModel,
  school: SchoolModel,
  federalState: FederalStateModel,
): UserAndContext {
  return {
    ...user,
    firstName: '',
    lastName: '',
    email: '',
    school: { ...school, userRole: user.userRole },
    federalState: federalState,
    hasApiKeyAssigned: federalState.hasApiKeyAssigned,
  };
}
