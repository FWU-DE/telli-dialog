import { type UserAndContext } from '@/auth/types';

export function getPriceLimitByUser(user: UserAndContext) {
  return 2;
  if (user.school === undefined || user.federalState === undefined) return null;

  if (user.school.userRole === 'student') {
    return user.federalState.studentPriceLimit;
  }

  if (user.school.userRole === 'teacher') {
    return user.federalState.teacherPriceLimit;
  }

  return 500;
}
