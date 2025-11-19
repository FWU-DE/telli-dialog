import { auth } from '@/auth';
import {
  federalStateSelectSchema,
  SchoolModel,
  schoolSelectSchema,
  UserModel,
  userSchema,
} from '@shared/db/schema';
import { ObscuredFederalState } from './utils';
import { UnauthorizedError } from '@shared/error';

export async function requireAuth(): Promise<{
  user: UserModel;
  school: SchoolModel;
  federalState: ObscuredFederalState;
}> {
  const session = await auth();
  if (!session) throw new UnauthorizedError();

  const user = userSchema.parse(session.user);
  const school = schoolSelectSchema.parse(session.user?.school);
  const federalState = federalStateSelectSchema.parse(session.user?.federalState);
  return { user: user, school: school, federalState: federalState };
}
