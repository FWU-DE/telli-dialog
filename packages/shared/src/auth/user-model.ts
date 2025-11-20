import { userSchoolRoleSchema, userSelectSchema } from '@shared/db/schema';
import z from 'zod';

// Because of data privacy, personal data is omitted
export const userSchema = userSelectSchema
  .omit({
    firstName: true,
    lastName: true,
    email: true,
  })
  .extend({
    userRole: userSchoolRoleSchema,
  });

export type UserModel = z.infer<typeof userSchema>;
