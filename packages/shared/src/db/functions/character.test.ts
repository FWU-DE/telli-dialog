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
  dbExtendSharedCharacterConversationExpiration,
  dbUpdateCharacterShareTokenPointsLimit,
} from './character';

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

describe('db character sharing helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('dbExtendSharedCharacterConversationExpiration', () => {
    it('extends from now when the loaded share is already expired', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));

      const currentShare = {
        id: 'share-1',
        expiredAt: new Date('2026-01-01T10:30:00.000Z'),
      };
      const update = mockUpdateReturning([]);

      const result = await dbExtendSharedCharacterConversationExpiration({
        share: currentShare,
        additionalTimeInMinutes: 30,
      });

      expect(update.set).toHaveBeenCalledWith({
        expiredAt: new Date('2026-01-01T11:00:00.000Z'),
      });
      expect(result).toBeNull();
    });

    it('extends from current expiration when expiration is in the future', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));

      const latestShare = {
        id: 'share-1',
        expiredAt: new Date('2026-01-01T10:30:00.000Z'),
      };
      const update = mockUpdateReturning([{ ...latestShare, expiredAt: new Date() }]);

      await dbExtendSharedCharacterConversationExpiration({
        share: latestShare,
        additionalTimeInMinutes: 15,
      });

      expect(update.set).toHaveBeenCalledWith({
        expiredAt: new Date('2026-01-01T10:45:00.000Z'),
      });
    });

    it('extends from now when the existing expiration is already in the past', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));

      const latestShare = {
        id: 'share-1',
        expiredAt: new Date('2026-01-01T09:30:00.000Z'),
      };
      const update = mockUpdateReturning([{ ...latestShare, expiredAt: new Date() }]);

      await dbExtendSharedCharacterConversationExpiration({
        share: latestShare,
        additionalTimeInMinutes: 20,
      });

      expect(update.set).toHaveBeenCalledWith({
        expiredAt: new Date('2026-01-01T10:20:00.000Z'),
      });
    });
  });

  describe('dbUpdateCharacterShareTokenPointsLimit', () => {
    it('returns null when there is no active unstopped share', async () => {
      mockSelectLatestShare([]);

      const result = await dbUpdateCharacterShareTokenPointsLimit({
        characterId: 'character-1',
        user: { id: 'teacher-1' },
        tokenPointsLimit: 75,
      });

      expect(result).toBeNull();
      expect(mocks.update).not.toHaveBeenCalled();
    });

    it('updates token points limit for latest active share', async () => {
      const latestShare = {
        id: 'share-1',
        tokenPointsLimit: 50,
      };
      const updatedShare = {
        ...latestShare,
        tokenPointsLimit: 80,
      };
      mockSelectLatestShare([latestShare]);
      const update = mockUpdateReturning([updatedShare]);

      const result = await dbUpdateCharacterShareTokenPointsLimit({
        characterId: 'character-1',
        user: { id: 'teacher-1' },
        tokenPointsLimit: 80,
      });

      expect(update.set).toHaveBeenCalledWith({ tokenPointsLimit: 80 });
      expect(result).toEqual(updatedShare);
    });
  });
});
