import { auth } from '@/auth';
import { SchoolModel, schoolSelectSchema } from '@shared/db/schema';
import { UserModel, userSchema } from '@shared/auth/user-model';
import { ObscuredFederalState } from './utils';
import { UnauthenticatedError } from '@shared/error';
import { federalStateSchema } from '@shared/federal-states/types';

export async function requireAuth(): Promise<{
  user: UserModel;
  school: SchoolModel;
  federalState: ObscuredFederalState;
}> {
  const session = await auth();
  if (!session) throw new UnauthenticatedError();

  const user = userSchema.parse({ ...session.user, userRole: session.user?.school?.userRole });
  const school = schoolSelectSchema.parse(session.user?.school);
  const federalState = federalStateSchema.parse({
    ...session.user?.federalState,
    hasApiKeyAssigned: session.user?.hasApiKeyAssigned,
  });
  return { user: user, school: school, federalState: federalState };
}
