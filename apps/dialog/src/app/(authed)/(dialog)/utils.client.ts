import { AccessLevel } from '@shared/db/schema';

export function buildGenericUrl(
  accessLevel: AccessLevel,
  route: 'characters' | 'custom' | 'shared-chats',
) {
  const searchParams = new URLSearchParams();
  searchParams.set('visibility', accessLevel);
  return `/${route}?${searchParams.toString()}`;
}
