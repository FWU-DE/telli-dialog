import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateTimeLeft } from './calculate-time-left';

describe('calculateTimeLeft', () => {
  const now = new Date('2024-06-01T10:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('manuallyStoppedAt behavior', () => {
    it('returns -1 when manuallyStoppedAt is set, regardless of remaining time', () => {
      const startedAt = new Date(now.getTime() - 5 * 60_000); // started 5 min ago
      const result = calculateTimeLeft({
        startedAt,
        maxUsageTimeLimit: 60, // 60-minute limit – plenty of time remaining
        manuallyStoppedAt: new Date(now.getTime() - 1000),
      });
      expect(result).toBe(-1);
    });

    it('returns -1 when manuallyStoppedAt is set even when the time limit would not be reached', () => {
      const startedAt = new Date(now.getTime() - 1000); // started 1 second ago
      const result = calculateTimeLeft({
        startedAt,
        maxUsageTimeLimit: 30 * 24 * 60, // maximum 30-day limit
        manuallyStoppedAt: now,
      });
      expect(result).toBe(-1);
    });

    it('proceeds to time-based calculation when manuallyStoppedAt is null', () => {
      const startedAt = new Date(now.getTime() - 10 * 60_000); // started 10 min ago
      const result = calculateTimeLeft({
        startedAt,
        maxUsageTimeLimit: 30, // 30-minute limit → 20 minutes remaining
        manuallyStoppedAt: null,
      });
      expect(result).toBe(20 * 60); // 1200 seconds
    });

    it('proceeds to time-based calculation when manuallyStoppedAt is undefined', () => {
      const startedAt = new Date(now.getTime() - 10 * 60_000);
      const result = calculateTimeLeft({
        startedAt,
        maxUsageTimeLimit: 30,
        // manuallyStoppedAt not provided
      });
      expect(result).toBe(20 * 60);
    });
  });

  describe('missing fields', () => {
    it('returns -1 when startedAt is null', () => {
      const result = calculateTimeLeft({
        startedAt: null,
        maxUsageTimeLimit: 60,
      });
      expect(result).toBe(-1);
    });

    it('returns -1 when maxUsageTimeLimit is null', () => {
      const result = calculateTimeLeft({
        startedAt: now,
        maxUsageTimeLimit: null,
      });
      expect(result).toBe(-1);
    });

    it('returns -1 when both startedAt and maxUsageTimeLimit are null', () => {
      const result = calculateTimeLeft({
        startedAt: null,
        maxUsageTimeLimit: null,
      });
      expect(result).toBe(-1);
    });
  });

  describe('time-based calculation', () => {
    it('returns the correct seconds remaining when time limit has not been reached', () => {
      const startedAt = new Date(now.getTime() - 15 * 60_000); // 15 min ago
      const result = calculateTimeLeft({
        startedAt,
        maxUsageTimeLimit: 45, // 45-minute limit → 30 minutes left
      });
      expect(result).toBe(30 * 60); // 1800 seconds
    });

    it('returns a negative value when the time limit has been exceeded', () => {
      const startedAt = new Date(now.getTime() - 60 * 60_000); // 60 min ago
      const result = calculateTimeLeft({
        startedAt,
        maxUsageTimeLimit: 30, // 30-minute limit → 30 minutes over
      });
      expect(result).toBeLessThan(0);
    });

    it('returns approximately 0 when the time limit has just been reached', () => {
      const startedAt = new Date(now.getTime() - 30 * 60_000); // exactly 30 min ago
      const result = calculateTimeLeft({
        startedAt,
        maxUsageTimeLimit: 30,
      });
      expect(result).toBeLessThanOrEqual(0);
    });

    it('returns full limit seconds when the chat was just started', () => {
      const result = calculateTimeLeft({
        startedAt: now,
        maxUsageTimeLimit: 45,
      });
      expect(result).toBe(45 * 60); // 2700 seconds
    });
  });
});
