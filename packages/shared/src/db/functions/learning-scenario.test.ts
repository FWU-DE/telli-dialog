import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
}));

vi.mock('..', () => ({
  db: {
    select: mocks.select,
    update: mocks.update,
  },
}));

import {
  dbExtendSharedLearningScenarioExpiration,
  dbUpdateLearningScenarioShareTokenPointsLimit,
} from './learning-scenario';

function mockSelectLatestShare(result: unknown[]) {
  const limit = vi.fn().mockResolvedValue(result);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy });
  const from = vi.fn().mockReturnValue({ where });
  mocks.select.mockReturnValue({ from });
  return { from, where, orderBy, limit };
}

function mockUpdateReturning(result: unknown[]) {
  const returning = vi.fn().mockResolvedValue(result);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  mocks.update.mockReturnValue({ set });
  return { set, where, returning };
}

describe('db learning scenario sharing helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('dbExtendSharedLearningScenarioExpiration', () => {
    it('returns null when there is no active unstopped share', async () => {
      mockSelectLatestShare([]);

      const result = await dbExtendSharedLearningScenarioExpiration({
        learningScenarioId: 'scenario-1',
        user: { id: 'teacher-1' },
        additionalTimeInMinutes: 30,
      });

      expect(result).toBeNull();
      expect(mocks.update).not.toHaveBeenCalled();
    });

    it('extends from current expiration when expiration is in the future', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));

      const latestShare = {
        id: 'share-1',
        expiredAt: new Date('2026-01-01T10:40:00.000Z'),
      };
      mockSelectLatestShare([latestShare]);
      const update = mockUpdateReturning([{ ...latestShare, expiredAt: new Date() }]);

      await dbExtendSharedLearningScenarioExpiration({
        learningScenarioId: 'scenario-1',
        user: { id: 'teacher-1' },
        additionalTimeInMinutes: 10,
      });

      expect(update.set).toHaveBeenCalledWith({
        expiredAt: new Date('2026-01-01T10:50:00.000Z'),
      });
    });

    it('extends from now when the existing expiration is already in the past', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));

      const latestShare = {
        id: 'share-1',
        expiredAt: new Date('2026-01-01T09:50:00.000Z'),
      };
      mockSelectLatestShare([latestShare]);
      const update = mockUpdateReturning([{ ...latestShare, expiredAt: new Date() }]);

      await dbExtendSharedLearningScenarioExpiration({
        learningScenarioId: 'scenario-1',
        user: { id: 'teacher-1' },
        additionalTimeInMinutes: 25,
      });

      expect(update.set).toHaveBeenCalledWith({
        expiredAt: new Date('2026-01-01T10:25:00.000Z'),
      });
    });
  });

  describe('dbUpdateLearningScenarioShareTokenPointsLimit', () => {
    it('returns null when there is no active unstopped share', async () => {
      mockSelectLatestShare([]);

      const result = await dbUpdateLearningScenarioShareTokenPointsLimit({
        learningScenarioId: 'scenario-1',
        user: { id: 'teacher-1' },
        tokenPointsLimit: 60,
      });

      expect(result).toBeNull();
      expect(mocks.update).not.toHaveBeenCalled();
    });

    it('updates token points limit for latest active share', async () => {
      const latestShare = {
        id: 'share-1',
        tokenPointsLimit: 40,
      };
      const updatedShare = {
        ...latestShare,
        tokenPointsLimit: 65,
      };
      mockSelectLatestShare([latestShare]);
      const update = mockUpdateReturning([updatedShare]);

      const result = await dbUpdateLearningScenarioShareTokenPointsLimit({
        learningScenarioId: 'scenario-1',
        user: { id: 'teacher-1' },
        tokenPointsLimit: 65,
      });

      expect(update.set).toHaveBeenCalledWith({ tokenPointsLimit: 65 });
      expect(result).toEqual(updatedShare);
    });
  });
});
