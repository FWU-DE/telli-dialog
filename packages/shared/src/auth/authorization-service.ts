import { ForbiddenError } from '@shared/error';
import { AccessLevel, UserSchoolRole } from '@shared/db/schema';
import { dbGetUserIdsWithSharedSchools } from '@shared/db/helpers/school-sharing';

type AuthorizedItem = {
  accessLevel: AccessLevel;
  hasLinkAccess: boolean;
  userId: string | null;
};

export async function verifyReadAccess<T extends AuthorizedItem>({
  item,
  userId,
}: {
  item: T;
  userId?: string;
}) {
  // allow access if shared by link
  if (item.hasLinkAccess) return;
  // allow access if shared globally
  if (item.accessLevel === 'global') return;
  // allow if owner (disregarding the access-level)
  if (item.userId && item.userId === userId) return;
  // allow if school-shared
  if (item.accessLevel === 'school') {
    if (
      userId &&
      item.userId &&
      (await dbGetUserIdsWithSharedSchools(userId)).includes(item.userId)
    )
      return;
  }

  throw new ForbiddenError('Not authorized for read access');
}

export function verifyWriteAccess<T extends AuthorizedItem>({
  item,
  userId,
}: {
  item: T;
  userId?: string;
}) {
  // allow if owner (disregarding the access-level)
  if (item.userId && item.userId === userId) return;

  throw new ForbiddenError('Not authorized for write access');
}

export function requireTeacherRole(userRole: UserSchoolRole) {
  // allow teacher role
  if (userRole === 'teacher') return;

  throw new ForbiddenError('Only teachers are allowed ');
}
