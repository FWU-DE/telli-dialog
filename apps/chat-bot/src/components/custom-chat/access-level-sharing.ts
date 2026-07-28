import { AccessLevel } from '@shared/db/schema';

type ShareFormValues = {
  isSchoolShared: boolean;
  isCommunityShared: boolean;
};

export function getShareFormValues(accessLevel: AccessLevel): ShareFormValues {
  return {
    isSchoolShared: accessLevel === 'school' || accessLevel === 'community',
    isCommunityShared: accessLevel === 'community',
  };
}

export function getAccessLevelFromShareForm({
  isSchoolShared,
  isCommunityShared,
}: ShareFormValues): Exclude<AccessLevel, 'global'> {
  if (isCommunityShared) {
    return 'community';
  }

  if (isSchoolShared) {
    return 'school';
  }

  return 'private';
}
