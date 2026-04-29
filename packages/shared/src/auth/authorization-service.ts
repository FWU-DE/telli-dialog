import { ForbiddenError } from '@shared/error';
import { AccessLevel, UserSchoolRole } from '@shared/db/schema';
import { UserModel } from './user-model';

type AuthorizedItem = {
  accessLevel: AccessLevel;
  hasLinkAccess: boolean;
  userId: string | null;
  schoolIds?: string[];
};

export async function verifyReadAccess<T extends AuthorizedItem>({
  item,
  user,
}: {
  item: T;
  user?: Pick<UserModel, 'id' | 'schoolIds'>;
}) {
  // allow access if shared by link
  if (item.hasLinkAccess) return;
  // allow access if shared globally
  if (item.accessLevel === 'global') return;
  // allow if owner (disregarding the access-level)
  if (item.userId && item.userId === user?.id) return;
  // allow if school-shared
  if (
    item.accessLevel === 'school' &&
    user?.schoolIds &&
    item.schoolIds?.some((id) => user.schoolIds?.includes(id))
  )
    return;

  throw new ForbiddenError('Not authorized for read access');
}

export function verifyWriteAccess<T extends AuthorizedItem>({
  item,
  user,
}: {
  item: T;
  user?: Pick<UserModel, 'id'>;
}) {
  // allow if owner (disregarding the access-level)
  if (item.userId && item.userId === user?.id) return;

  throw new ForbiddenError('Not authorized for write access');
}

export function requireTeacherRole(userRole: UserSchoolRole) {
  // allow teacher role
  if (userRole === 'teacher') return;

  throw new ForbiddenError('Only teachers are allowed ');
}
