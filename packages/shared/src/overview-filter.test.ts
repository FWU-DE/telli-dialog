import { describe, it, expect } from 'vitest';
import { overviewFilterSchema } from './overview-filter';

describe('overviewFilterSchema', () => {
  it('should preserve the required enum order', () => {
    const options = overviewFilterSchema.options;
    expect(options).toEqual(['mine', 'official', 'school', 'community', 'all']);
  });
});
