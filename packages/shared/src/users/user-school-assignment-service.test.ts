import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db';
import { dbGetFederalStateById } from '../db/functions/federal-state';
import {
  assignUserToSchools,
  mapVidisRoleToUserSchoolRole,
  normalizeSchoolIds,
} from './user-school-assignment-service';
import type { VidisUserInfo } from '../auth/vidis';

vi.mock('../db', () => ({
  db: {
    transaction: vi.fn(),
  },
}));

vi.mock('../db/functions/federal-state', () => ({
  dbGetFederalStateById: vi.fn(),
}));

function createInsertMock(returnValues: Array<Record<string, unknown> | undefined>) {
  let index = 0;

  return vi.fn().mockImplementation(() => ({
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockReturnValue({
        returning: vi.fn().mockImplementation(async () => [returnValues[index++]]),
      }),
    }),
  }));
}

describe('user-school-assignment-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapVidisRoleToUserSchoolRole', () => {
    it('should map LEHR to teacher', () => {
      expect(mapVidisRoleToUserSchoolRole('LEHR')).toBe('teacher');
    });

    it('should map LERN to student', () => {
      expect(mapVidisRoleToUserSchoolRole('LERN')).toBe('student');
    });

    it('should map LEIT to teacher', () => {
      expect(mapVidisRoleToUserSchoolRole('LEIT')).toBe('teacher');
    });

    it('should map unknown role to student', () => {
      expect(mapVidisRoleToUserSchoolRole('UNKNOWN')).toBe('student');
    });
  });

  describe('normalizeSchoolIds', () => {
    it('should convert single string to array', () => {
      expect(normalizeSchoolIds('school-123')).toEqual(['school-123']);
    });

    it('should return array as-is', () => {
      const schools = ['school-123', 'school-456'];
      expect(normalizeSchoolIds(schools)).toEqual(schools);
    });

    it('should handle empty array', () => {
      expect(normalizeSchoolIds([])).toEqual([]);
    });

    it('should handle array with single element', () => {
      expect(normalizeSchoolIds(['school-123'])).toEqual(['school-123']);
    });
  });

  describe('assignUserToSchools', () => {
    it('throws when federal state does not exist', async () => {
      vi.mocked(dbGetFederalStateById).mockResolvedValue(undefined);

      const userInfo: VidisUserInfo = {
        sub: 'user-1',
        rolle: 'LEHR',
        schulkennung: 'school-1',
        bundesland: 'state-1',
      };

      await expect(assignUserToSchools(userInfo)).rejects.toThrow(
        'Federal state not found: state-1',
      );
    });

    it('throws when no schools are provided by the IDP', async () => {
      vi.mocked(dbGetFederalStateById).mockResolvedValue({ id: 'state-1' } as never);

      const userInfo: VidisUserInfo = {
        sub: 'user-1',
        rolle: 'LEHR',
        schulkennung: [],
        bundesland: 'state-1',
      };

      await expect(assignUserToSchools(userInfo)).rejects.toThrow(
        'No schools provided by identity provider',
      );
    });

    it('creates user and mappings for a single school', async () => {
      vi.mocked(dbGetFederalStateById).mockResolvedValue({ id: 'state-1' } as never);

      const insertMock = createInsertMock([
        { id: 'school-1', federalStateId: 'state-1' },
        { id: 'user-1', firstName: '', lastName: '', email: 'user-1@vidis.schule' },
        { id: 'mapping-1' },
      ]);
      const whereMock = vi.fn().mockResolvedValue(undefined);
      const deleteMock = vi.fn().mockReturnValue({ where: whereMock });

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback({ insert: insertMock, delete: deleteMock } as never);
      });

      const userInfo: VidisUserInfo = {
        sub: 'user-1',
        rolle: 'LEHR',
        schulkennung: 'school-1',
        bundesland: 'state-1',
      };

      const result = await assignUserToSchools(userInfo);

      expect(result.id).toBe('user-1');
      expect(result.role).toBe('teacher');
      expect(insertMock).toHaveBeenCalledTimes(3);
      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(whereMock).toHaveBeenCalledTimes(1);
    });

    it('syncs mappings for multiple schools and returns student role', async () => {
      vi.mocked(dbGetFederalStateById).mockResolvedValue({ id: 'state-1' } as never);

      const insertMock = createInsertMock([
        { id: 'school-1', federalStateId: 'state-1' },
        { id: 'school-2', federalStateId: 'state-1' },
        { id: 'user-1', firstName: '', lastName: '', email: 'user-1@vidis.schule' },
        { id: 'mapping-1' },
        { id: 'mapping-2' },
      ]);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback({
          insert: insertMock,
          delete: vi.fn().mockReturnValue({ where: vi.fn() }),
        } as never);
      });

      const userInfo: VidisUserInfo = {
        sub: 'user-1',
        rolle: 'LERN',
        schulkennung: ['school-1', 'school-2'],
        bundesland: 'state-1',
      };

      const result = await assignUserToSchools(userInfo);

      expect(result.id).toBe('user-1');
      expect(result.role).toBe('student');
      expect(insertMock).toHaveBeenCalledTimes(5);
    });
  });
});
