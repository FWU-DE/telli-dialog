import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VidisProfile } from '@shared/auth/vidis';
import { validateAndSyncVidisUser } from './vidis';

vi.mock('next-auth', () => ({
  customFetch: Symbol('customFetch'),
}));

const { mockDbGetFederalStateById, mockDbGetUserById, mockDbCreateUser, mockDbUpdateUserById } =
  vi.hoisted(() => {
    return {
      mockDbGetFederalStateById: vi.fn(),
      mockDbGetUserById: vi.fn(),
      mockDbCreateUser: vi.fn(),
      mockDbUpdateUserById: vi.fn(),
    };
  });

vi.mock('@shared/db/functions/federal-state', () => ({
  dbGetFederalStateById: mockDbGetFederalStateById,
}));

vi.mock('@telli/shared/db/functions/user', () => ({
  dbGetUserById: mockDbGetUserById,
  dbCreateUser: mockDbCreateUser,
  dbUpdateUserById: mockDbUpdateUserById,
}));

const buildValidProfile = (overrides: Partial<VidisProfile> = {}): VidisProfile => ({
  sub: 'user-123',
  sid: 'session-123',
  rolle: 'LEHR',
  schulkennung: 'school-123',
  bundesland: 'DE-TEST',
  ...overrides,
});

describe('vidis provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateAndSyncVidisUser', () => {
    it('should return field errors for invalid profile payload', async () => {
      const result = await validateAndSyncVidisUser({ sid: 'session-123' });

      expect(result).toEqual({
        success: false,
        fieldErrors: ['sub', 'rolle', 'schulkennung', 'bundesland'],
      });
      expect(mockDbGetFederalStateById).not.toHaveBeenCalled();
    });

    it('should return auth error when federal state does not exist', async () => {
      mockDbGetFederalStateById.mockResolvedValue(undefined);

      const result = await validateAndSyncVidisUser(buildValidProfile());

      expect(result).toEqual({ success: false, authError: 'federal_state_not_found' });
      expect(mockDbCreateUser).not.toHaveBeenCalled();
      expect(mockDbUpdateUserById).not.toHaveBeenCalled();
    });

    it('should create a user when it does not exist', async () => {
      mockDbGetFederalStateById.mockResolvedValue({ id: 'DE-TEST' });
      mockDbGetUserById.mockResolvedValue(undefined);

      const result = await validateAndSyncVidisUser(
        buildValidProfile({ schulkennung: [' A ', 'B'] }),
      );

      expect(result).toEqual({ success: true });
      expect(mockDbCreateUser).toHaveBeenCalledWith({
        id: 'user-123',
        firstName: '',
        lastName: '',
        email: 'user-123@vidis.schule',
        schoolIds: ['A', 'B'],
        federalStateId: 'DE-TEST',
        userRole: 'teacher',
      });
      expect(mockDbUpdateUserById).not.toHaveBeenCalled();
    });

    it('should return auth error when federal state changed for existing user', async () => {
      mockDbGetFederalStateById.mockResolvedValue({ id: 'DE-TEST' });
      mockDbGetUserById.mockResolvedValue({
        id: 'user-123',
        email: 'user-123@vidis.schule',
        firstName: '',
        lastName: '',
        federalStateId: 'BY',
      });

      const result = await validateAndSyncVidisUser(buildValidProfile());

      expect(result).toEqual({ success: false, authError: 'federal_state_changed' });
      expect(mockDbCreateUser).not.toHaveBeenCalled();
      expect(mockDbUpdateUserById).not.toHaveBeenCalled();
    });

    it('should update an existing user without changing federal state', async () => {
      mockDbGetFederalStateById.mockResolvedValue({ id: 'DE-TEST' });
      mockDbGetUserById.mockResolvedValue({
        id: 'user-123',
        email: 'existing@vidis.schule',
        firstName: 'First',
        lastName: 'Last',
        federalStateId: 'DE-TEST',
      });

      const result = await validateAndSyncVidisUser(
        buildValidProfile({ rolle: 'LERN', schulkennung: [' school-1 ', ''] }),
      );

      expect(result).toEqual({ success: true });
      expect(mockDbUpdateUserById).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'existing@vidis.schule',
        firstName: 'First',
        lastName: 'Last',
        schoolIds: ['school-1'],
        federalStateId: 'DE-TEST',
        userRole: 'student',
      });
      expect(mockDbCreateUser).not.toHaveBeenCalled();
    });
  });
});
