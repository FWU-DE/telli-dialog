import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@shared/db/functions/token-points', () => ({
  dbGetSharedChatUsageInCentBySharedChatId: vi.fn(),
  dbGetSharedCharacterChatUsageInCentByCharacterId: vi.fn(),
}));

vi.mock('@shared/users/user-budget-service', () => ({
  getMaxBudgetInCentByUser: vi.fn(),
  getUsedBudgetInCentByUser: vi.fn(),
}));

import { sharedChatHasExpired } from './usage';
import { getMaxBudgetInCentByUser } from '@shared/users/user-budget-service';
import { dbGetSharedChatUsageInCentBySharedChatId } from '@shared/db/functions/token-points';

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
});

describe('coverage for uncovered branches', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sharedLearningScenarioChatHasReachedTokenPointsLimit handles teacher with usage below limit', async () => {
    const { sharedLearningScenarioChatHasReachedTokenPointsLimit } = await import('./usage');

    const mockUser = {
      id: 'user-1',
      userRole: 'teacher' as const,
      federalState: { id: 'state-1', teacherPriceLimit: 1000 },
    };

    const mockScenario = {
      id: 'scenario-1',
      startedAt: new Date(),
      maxUsageTimeLimit: 60,
      tokenPointsLimit: 10,
    };

    vi.mocked(dbGetSharedChatUsageInCentBySharedChatId).mockResolvedValue(50); // below 100 (10% of 1000)
    vi.mocked(getMaxBudgetInCentByUser).mockResolvedValue(1000);

    const result = await sharedLearningScenarioChatHasReachedTokenPointsLimit({
      user: mockUser as any,
      learningScenario: mockScenario as any,
    });

    expect(result).toBe(false);
  });

  it('userHasReachedTokenPointsLimit handles exceeding budget', async () => {
    const { userHasReachedTokenPointsLimit } = await import('./usage');
    const { getUsedBudgetInCentByUser } = await import('@shared/users/user-budget-service');

    const mockUser = {
      id: 'user-1',
      userRole: 'teacher' as const,
      federalState: { id: 'state-1', teacherPriceLimit: 1000 },
    };

    vi.mocked(getUsedBudgetInCentByUser).mockResolvedValue(1500); // exceeds 1000
    vi.mocked(getMaxBudgetInCentByUser).mockResolvedValue(1000);

    const result = await userHasReachedTokenPointsLimit({
      user: mockUser as any,
    });

    expect(result).toBe(true);
  });
});
