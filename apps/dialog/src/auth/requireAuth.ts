import { auth } from '@/auth';
import { SchoolSelectModel, schoolSelectSchema } from '@shared/db/schema';
import { UserModel, userSchema } from '@shared/auth/user-model';
import { FederalStateModel, federalStateSchema } from '@shared/federal-states/types';
import { headers } from 'next/headers';
import { redirectToLogin } from './utils';

export async function requireAuth(): Promise<{
  user: UserModel;
  school: SchoolSelectModel;
  federalState: FederalStateModel;
}> {
  const session = await auth();
  if (!session) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '/';
    redirectToLogin(pathname);
  }

  const user = userSchema.parse({ ...session.user, userRole: session.user?.school?.userRole });
  const school = schoolSelectSchema.parse(session.user?.school);
  const federalState = federalStateSchema.parse({
    ...session.user?.federalState,
    hasApiKeyAssigned: session.user?.hasApiKeyAssigned,
  });
  return { user: user, school: school, federalState: federalState };
}
