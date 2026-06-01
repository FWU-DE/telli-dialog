import { AccessLevel, ShareTarget } from '@shared/db/schema';

type ShareConfiguredItem = {
  accessLevel: AccessLevel;
  shareTargets?: ShareTarget[] | null;
};

export function getShareTargets(item: Pick<ShareConfiguredItem, 'shareTargets'>): ShareTarget[] {
  return item.shareTargets ?? [];
}

export function normalizeShareTargets(shareTargets: readonly ShareTarget[]): ShareTarget[] {
  return [
    ...(shareTargets.includes('school') ? (['school'] as const) : []),
    ...(shareTargets.includes('community') ? (['community'] as const) : []),
  ];
}

export function getAccessLevelFromShareTargets(
  shareTargets: readonly ShareTarget[],
): Exclude<AccessLevel, 'global'> {
  if (shareTargets.includes('community')) {
    return 'community';
  }

  if (shareTargets.includes('school')) {
    return 'school';
  }

  return 'private';
}

export function isOfficialTemplate(item: Pick<ShareConfiguredItem, 'accessLevel'>) {
  return item.accessLevel === 'global';
}

export function isCommunityAccessible(item: Pick<ShareConfiguredItem, 'accessLevel'>) {
  return item.accessLevel === 'community' || item.accessLevel === 'global';
}

export function isSchoolAccessible(item: Pick<ShareConfiguredItem, 'accessLevel'>) {
  return item.accessLevel === 'school';
}

export function isSharedWithSchool(item: Pick<ShareConfiguredItem, 'shareTargets'>) {
  return getShareTargets(item).includes('school');
}

export function isSharedWithCommunity(item: Pick<ShareConfiguredItem, 'shareTargets'>) {
  return getShareTargets(item).includes('community');
}

export function isPrivate(item: Pick<ShareConfiguredItem, 'accessLevel'>) {
  return item.accessLevel === 'private';
}
