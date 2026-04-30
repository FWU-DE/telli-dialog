import { userRoleSchema, userSelectSchema } from '@shared/db/schema';
import z from 'zod';

// Because of data privacy, personal data is omitted
export const userSchema = userSelectSchema
  .omit({
    firstName: true,
    lastName: true,
    email: true,
  })
  .extend({
    federalStateId: z.string(),
    userRole: userRoleSchema,
  });

export type UserModel = z.infer<typeof userSchema>;
