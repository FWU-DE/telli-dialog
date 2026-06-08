import { describe, expect, it } from 'vitest';
import { getAccessLevelFromShareForm, getShareFormValues } from './access-level-sharing';

describe('access-level-sharing', () => {
  it('keeps school checked for community access', () => {
    expect(getShareFormValues('community')).toEqual({
      isSchoolShared: true,
      isCommunityShared: true,
    });
  });

  it('maps combined school and community selection back to community', () => {
    expect(
      getAccessLevelFromShareForm({
        isSchoolShared: true,
        isCommunityShared: true,
      }),
    ).toBe('community');
  });
});
