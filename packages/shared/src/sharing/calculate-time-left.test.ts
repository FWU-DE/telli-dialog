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
      const expiredAt = new Date(now.getTime() + 55 * 60_000); // expires in 55 minutes
      const result = calculateTimeLeft({
        expiredAt,
        manuallyStoppedAt: new Date(now.getTime() - 1000),
      });
      expect(result).toBe(-1);
    });

    it('returns -1 when manuallyStoppedAt is set even when the time limit would not be reached', () => {
      const expiredAt = new Date(now.getTime() + 30 * 24 * 60 * 60_000); // expires in 30 days
      const result = calculateTimeLeft({
        expiredAt,
        manuallyStoppedAt: now,
      });
      expect(result).toBe(-1);
    });

    it.each([null, undefined])(
      'proceeds to time-based calculation when manuallyStoppedAt is $0',
      (manuallyStoppedAt) => {
        const expiredAt = new Date(now.getTime() + 20 * 60_000); // expires in 20 minutes
        const result = calculateTimeLeft({
          expiredAt,
          manuallyStoppedAt,
        });
        expect(result).toBe(20 * 60); // 1200 seconds
      },
    );
  });

  describe('missing fields', () => {
    it('returns -1 when expiredAt is null', () => {
      const result = calculateTimeLeft({
        expiredAt: null,
      });
      expect(result).toBe(-1);
    });
  });

  describe('time-based calculation', () => {
    it('returns the correct seconds remaining when time limit has not been reached', () => {
      const expiredAt = new Date(now.getTime() + 30 * 60_000); // expires in 30 minutes
      const result = calculateTimeLeft({
        expiredAt,
      });
      expect(result).toBe(30 * 60); // 1800 seconds
    });

    it('returns a negative value when the time limit has been exceeded', () => {
      const expiredAt = new Date(now.getTime() - 30 * 60_000); // expired 30 minutes ago
      const result = calculateTimeLeft({
        expiredAt,
      });
      expect(result).toBeLessThan(0);
    });

    it('returns approximately 0 when the time limit has just been reached', () => {
      const expiredAt = new Date(now.getTime()); // expired exactly now
      const result = calculateTimeLeft({
        expiredAt,
      });
      expect(result).toBeLessThanOrEqual(0);
    });

    it('returns full limit seconds when the chat was just started', () => {
      const expiredAt = new Date(now.getTime() + 45 * 60_000); // expires in 45 minutes
      const result = calculateTimeLeft({
        expiredAt,
      });
      expect(result).toBe(45 * 60); // 2700 seconds
    });
  });
});
