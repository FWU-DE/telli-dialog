import { describe, expect, it } from 'vitest';
import {
  getAccessLevelFromShareTargets,
  getShareTargets,
  isCommunityAccessible,
  isOfficialTemplate,
  isPrivate,
  isSchoolAccessible,
  isSharedWithCommunity,
  isSharedWithSchool,
  normalizeShareTargets,
} from './share-targets';

describe('share-targets', () => {
  it('returns an empty list when shareTargets are missing', () => {
    expect(getShareTargets({ shareTargets: null })).toEqual([]);
    expect(getShareTargets({})).toEqual([]);
  });

  it('normalizes share targets to the supported order without duplicates', () => {
    expect(normalizeShareTargets(['community', 'school', 'community'])).toEqual([
      'school',
      'community',
    ]);
  });

  it('derives private access level when no share target is enabled', () => {
    expect(getAccessLevelFromShareTargets([])).toBe('private');
  });

  it('derives school access level when only school sharing is enabled', () => {
    expect(getAccessLevelFromShareTargets(['school'])).toBe('school');
  });

  it('derives community access level when community sharing is enabled', () => {
    expect(getAccessLevelFromShareTargets(['school', 'community'])).toBe('community');
  });

  it('recognizes official, community, school, and private visibility correctly', () => {
    expect(isOfficialTemplate({ accessLevel: 'global' })).toBe(true);
    expect(isCommunityAccessible({ accessLevel: 'community' })).toBe(true);
    expect(isCommunityAccessible({ accessLevel: 'global' })).toBe(true);
    expect(isCommunityAccessible({ accessLevel: 'school' })).toBe(false);
    expect(isSchoolAccessible({ accessLevel: 'school' })).toBe(true);
    expect(isSchoolAccessible({ accessLevel: 'community' })).toBe(false);
    expect(isPrivate({ accessLevel: 'private' })).toBe(true);
    expect(isPrivate({ accessLevel: 'global' })).toBe(false);
  });

  it('detects school and community share targets independently', () => {
    expect(isSharedWithSchool({ shareTargets: ['school'] })).toBe(true);
    expect(isSharedWithSchool({ shareTargets: ['community'] })).toBe(false);
    expect(isSharedWithCommunity({ shareTargets: ['community'] })).toBe(true);
    expect(isSharedWithCommunity({ shareTargets: ['school'] })).toBe(false);
  });
});
