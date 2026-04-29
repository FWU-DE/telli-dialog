import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VidisProfile } from '@shared/auth/vidis';
import {
  generateErrorUrl,
  getAuthErrorFromUrl,
  getFieldErrorsFromUrl,
  validateAndSyncVidisUser,
  validateOidcProfile,
} from './authentication-service';

const {
  mockDbGetFederalStateById,
  mockDbGetUserById,
  mockDbCreateVidisUser,
  mockDbUpdateVidisUserById,
} = vi.hoisted(() => {
  return {
    mockDbGetFederalStateById: vi.fn(),
    mockDbGetUserById: vi.fn(),
    mockDbCreateVidisUser: vi.fn(),
    mockDbUpdateVidisUserById: vi.fn(),
  };
});

vi.mock('../db/functions/federal-state', () => ({
  dbGetFederalStateById: mockDbGetFederalStateById,
}));

vi.mock('../db/functions/user', () => ({
  dbGetUserById: mockDbGetUserById,
}));

vi.mock('../db/functions/vidis', async () => {
  const actual = await vi.importActual('../db/functions/vidis');

  return {
    ...actual,
    dbCreateVidisUser: mockDbCreateVidisUser,
    dbUpdateVidisUserById: mockDbUpdateVidisUserById,
  };
});

const buildValidProfile = (overrides: Partial<VidisProfile> = {}): VidisProfile => ({
  sub: 'user-123',
  sid: 'session-123',
  rolle: 'LEHR',
  schulkennung: 'school-123',
  bundesland: 'DE-TEST',
  ...overrides,
});

describe('authentication-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateOidcProfile', () => {
    it('should return success true for valid profile', () => {
      const profile = buildValidProfile();
      const result = validateOidcProfile(profile);
      expect(result).toEqual({ success: true });
    });

    it('should return missing fields for invalid profile', () => {
      const profile = {
        sub: 'user-123',
        sid: 'session-123',
      };
      const result = validateOidcProfile(profile);
      expect(result).toEqual({
        success: false,
        fieldErrors: ['rolle', 'schulkennung', 'bundesland'],
      });
    });

    it('should return error when rolle is an empty string', () => {
      const result = validateOidcProfile(buildValidProfile({ rolle: '  ' }));
      expect(result).toEqual({ success: false, fieldErrors: ['rolle'] });
    });

    it('should return error when bundesland is an empty string', () => {
      const result = validateOidcProfile(buildValidProfile({ bundesland: '   ' }));
      expect(result).toEqual({ success: false, fieldErrors: ['bundesland'] });
    });

    it('should return error when schulkennung is an empty string', () => {
      const result = validateOidcProfile(buildValidProfile({ schulkennung: '   ' }));
      expect(result).toEqual({ success: false, fieldErrors: ['schulkennung'] });
    });

    it('should return error when schulkennung array has only empty values', () => {
      const result = validateOidcProfile(buildValidProfile({ schulkennung: [' ', ''] }));
      expect(result).toEqual({ success: false, fieldErrors: ['schulkennung'] });
    });
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
      expect(mockDbCreateVidisUser).not.toHaveBeenCalled();
      expect(mockDbUpdateVidisUserById).not.toHaveBeenCalled();
    });

    it('should create a user when it does not exist', async () => {
      mockDbGetFederalStateById.mockResolvedValue({ id: 'DE-TEST' });
      mockDbGetUserById.mockResolvedValue(undefined);

      const result = await validateAndSyncVidisUser(
        buildValidProfile({ schulkennung: [' A ', 'B'] }),
      );

      expect(result).toEqual({ success: true });
      expect(mockDbCreateVidisUser).toHaveBeenCalledWith({
        id: 'user-123',
        firstName: '',
        lastName: '',
        email: 'user-123@vidis.schule',
        schoolIds: ['A', 'B'],
        federalStateId: 'DE-TEST',
        userRole: 'teacher',
      });
      expect(mockDbUpdateVidisUserById).not.toHaveBeenCalled();
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
      expect(mockDbCreateVidisUser).not.toHaveBeenCalled();
      expect(mockDbUpdateVidisUserById).not.toHaveBeenCalled();
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
      expect(mockDbUpdateVidisUserById).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'existing@vidis.schule',
        firstName: 'First',
        lastName: 'Last',
        schoolIds: ['school-1'],
        federalStateId: 'DE-TEST',
        userRole: 'student',
      });
      expect(mockDbCreateVidisUser).not.toHaveBeenCalled();
    });
  });

  describe('generateErrorUrl', () => {
    it('should generate correct error URL', () => {
      const fieldErrors = ['rolle', 'schulkennung'];
      const errorUrl = generateErrorUrl(fieldErrors);
      expect(errorUrl).toBe('/login/error?profile_error=rolle%2Cschulkennung');
    });

    it('should generate auth error URL without field errors', () => {
      const errorUrl = generateErrorUrl([], 'federal_state_not_found');
      expect(errorUrl).toBe('/login/error?auth_error=federal_state_not_found');
    });

    it('should generate URL with field and auth errors', () => {
      const errorUrl = generateErrorUrl(['rolle'], 'federal_state_changed');
      expect(errorUrl).toBe('/login/error?profile_error=rolle&auth_error=federal_state_changed');
    });

    it('should generate empty error URL if no missing fields are provided', () => {
      const fieldErrors: string[] = [];
      const errorUrl = generateErrorUrl(fieldErrors);
      expect(errorUrl).toBe('/login/error');
    });
  });

  describe('getFieldErrorsFromUrl', () => {
    it('should return field errors from encoded URL search params', () => {
      const searchParams = {
        profile_error: 'rolle%2Cschulkennung',
      };
      const fieldErrors = getFieldErrorsFromUrl(searchParams);
      expect(fieldErrors).toEqual(['rolle', 'schulkennung']);
    });
    it('should return field errors from decoded URL search params', () => {
      const searchParams = {
        profile_error: 'rolle,schulkennung',
      };
      const fieldErrors = getFieldErrorsFromUrl(searchParams);
      expect(fieldErrors).toEqual(['rolle', 'schulkennung']);
    });

    it('should return empty array if no profile_error param is present', () => {
      const searchParams = {
        other_param: 'value',
      };
      const fieldErrors = getFieldErrorsFromUrl(searchParams);
      expect(fieldErrors).toEqual([]);
    });

    it('should return empty array if profile_error is undefined', () => {
      const fieldErrors = getFieldErrorsFromUrl({ profile_error: undefined });
      expect(fieldErrors).toEqual([]);
    });
  });

  describe('getAuthErrorFromUrl', () => {
    it('should return auth error from search params', () => {
      const authError = getAuthErrorFromUrl({ auth_error: 'federal_state_not_found' });
      expect(authError).toBe('federal_state_not_found');
    });

    it('should return undefined for invalid auth_error values', () => {
      const authError = getAuthErrorFromUrl({ auth_error: 'invalid_code' });
      expect(authError).toBeUndefined();
    });

    it('should return undefined if auth_error is missing', () => {
      const authError = getAuthErrorFromUrl({ profile_error: 'rolle' });
      expect(authError).toBeUndefined();
    });
  });
});
