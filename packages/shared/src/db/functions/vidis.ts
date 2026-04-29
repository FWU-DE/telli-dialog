import { VidisUserInfo } from '../../auth/vidis';
import { UserSchoolRole } from '../schema';

export function vidisRoleToUserSchoolRole(role: string): UserSchoolRole {
  switch (role) {
    case 'LEHR':
      return 'teacher';
    case 'LERN':
      return 'student';
    case 'LEIT':
      return 'teacher';
    default:
      return 'student';
  }
}

export function normalizeVidisSchoolIds(schulkennung: VidisUserInfo['schulkennung']): string[] {
  const schoolIds = typeof schulkennung === 'string' ? [schulkennung] : schulkennung;
  return schoolIds.map((schoolId) => schoolId.trim()).filter((schoolId) => schoolId.length > 0);
}
