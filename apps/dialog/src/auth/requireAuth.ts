import { auth } from '@/auth';
import { SchoolModel, schoolSelectSchema, UserModel, userSelectSchema } from '@shared/db/schema';
import { ObscuredFederalState } from './utils';
import { UnauthenticatedError } from '@shared/error';
import { federalStateSchema } from '@shared/types/federal-state';

export async function requireAuth(): Promise<{
  user: UserModel;
  school: SchoolModel;
  federalState: ObscuredFederalState;
}> {
  const session = await auth();
  if (!session) throw new UnauthenticatedError();

  // hasApiKeyAssigned is assigned to the user in session object
  const federalStateFromSession = {
    ...session.user?.federalState,
    hasApiKeyAssigned: session.user?.hasApiKeyAssigned,
  };

  const user = userSelectSchema.parse(session.user);
  const school = schoolSelectSchema.parse(session.user?.school);
  const federalState = federalStateSchema.parse(federalStateFromSession);
  return { user: user, school: school, federalState: federalState };
}
