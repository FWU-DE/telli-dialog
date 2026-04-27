import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/school', () => ({
  getPriceInCentByUser: vi.fn(),
  getPriceLimitInCentByUser: vi.fn(),
}));

vi.mock('@shared/db/functions/telli-points', () => ({
  dbGetSharedChatUsageInCentBySharedChatId: vi.fn(),
  dbGetSharedCharacterChatUsageInCentByCharacterId: vi.fn(),
}));

import { sharedChatHasExpired } from './usage';

describe('sharedChatHasExpired', () => {
  const now = new Date('2024-06-01T10:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('manually stopped (manuallyStoppedAt)', () => {
    it('returns true when manuallyStoppedAt is set, even if time limit has not been reached', () => {
      const startedAt = new Date(now.getTime() - 5 * 60_000); // 5 min ago
      const result = sharedChatHasExpired({
        startedAt,
        maxUsageTimeLimit: 60, // 60-minute limit – plenty of time left
        manuallyStoppedAt: new Date(now.getTime() - 1000),
      });
      expect(result).toBe(true);
    });

    it('returns true when manuallyStoppedAt equals now', () => {
      const result = sharedChatHasExpired({
        startedAt: new Date(now.getTime() - 10 * 60_000),
        maxUsageTimeLimit: 30,
        manuallyStoppedAt: now,
      });
      expect(result).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('returns true when startedAt is null', () => {
      const result = sharedChatHasExpired({
        startedAt: null,
        maxUsageTimeLimit: 60,
      });
      expect(result).toBe(true);
    });

    it('returns true when maxUsageTimeLimit is null', () => {
      const result = sharedChatHasExpired({
        startedAt: new Date(now.getTime() - 5 * 60_000),
        maxUsageTimeLimit: null,
      });
      expect(result).toBe(true);
    });

    it('returns true when both startedAt and maxUsageTimeLimit are null', () => {
      const result = sharedChatHasExpired({
        startedAt: null,
        maxUsageTimeLimit: null,
      });
      expect(result).toBe(true);
    });
  });

  describe('auto-expiry based on time limit', () => {
    it('returns false when the time limit has not been reached', () => {
      const startedAt = new Date(now.getTime() - 10 * 60_000); // 10 min ago
      const result = sharedChatHasExpired({
        startedAt,
        maxUsageTimeLimit: 30, // 30-minute limit → 20 min remaining
      });
      expect(result).toBe(false);
    });

    it('returns true when the time limit has been exceeded', () => {
      const startedAt = new Date(now.getTime() - 60 * 60_000); // 60 min ago
      const result = sharedChatHasExpired({
        startedAt,
        maxUsageTimeLimit: 30, // 30-minute limit → expired
      });
      expect(result).toBe(true);
    });

    it('returns true when the time limit has just been reached (0 seconds left)', () => {
      const startedAt = new Date(now.getTime() - 30 * 60_000); // exactly 30 min ago
      const result = sharedChatHasExpired({
        startedAt,
        maxUsageTimeLimit: 30,
      });
      expect(result).toBe(true);
    });
  });

  describe('manuallyStoppedAt=null does not trigger manual-stop path', () => {
    it('returns false when manuallyStoppedAt is null and time limit is not reached', () => {
      const startedAt = new Date(now.getTime() - 5 * 60_000); // 5 min ago
      const result = sharedChatHasExpired({
        startedAt,
        maxUsageTimeLimit: 30,
        manuallyStoppedAt: null,
      });
      expect(result).toBe(false);
    });

    it('returns true when manuallyStoppedAt is null but time limit is exceeded', () => {
      const startedAt = new Date(now.getTime() - 60 * 60_000); // 60 min ago
      const result = sharedChatHasExpired({
        startedAt,
        maxUsageTimeLimit: 30,
        manuallyStoppedAt: null,
      });
      expect(result).toBe(true);
    });
  });
});
