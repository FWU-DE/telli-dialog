import { UserSchoolRole } from '../schema';

type VidisSchoolIds = string | string[];

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

export function normalizeVidisSchoolIds(schulkennung: VidisSchoolIds): string[] {
  const schoolIds = typeof schulkennung === 'string' ? [schulkennung] : schulkennung;
  return schoolIds.map((schoolId) => schoolId.trim()).filter((schoolId) => schoolId.length > 0);
}
