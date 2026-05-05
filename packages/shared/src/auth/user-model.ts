import { userRoleSchema, userSelectSchema } from '@shared/db/schema';
import z from 'zod';

export const userSchema = userSelectSchema.extend({
  federalStateId: z.string(),
  userRole: userRoleSchema,
});

export type UserModel = z.infer<typeof userSchema>;
