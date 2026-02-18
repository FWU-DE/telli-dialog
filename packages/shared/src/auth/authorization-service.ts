import { ForbiddenError } from '@shared/error';
import { AccessLevel, UserSchoolRole } from '@shared/db/schema';

type AuthorizedItem = {
  accessLevel: AccessLevel;
  hasLinkAccess: boolean;
  schoolId: string | null;
  userId: string | null;
};

export function verifyReadAccess<T extends AuthorizedItem>({
  item,
  schoolId,
  userId,
}: {
  item: T;
  schoolId?: string;
  userId?: string;
}) {
  // allow access if shared by link
  if (item.hasLinkAccess) return;
  // allow access if shared globally
  if (item.accessLevel === 'global') return;
  // allow if owner (disregarding the access-level)
  if (item.userId && item.userId === userId) return;
  // allow if school-shared and the same school
  if (item.accessLevel === 'school' && item.schoolId && item.schoolId === schoolId) return;

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
