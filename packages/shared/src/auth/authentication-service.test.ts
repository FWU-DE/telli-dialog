import { describe, expect, it } from 'vitest';
import { VidisProfile } from '@shared/auth/vidis';
import {
  generateErrorUrl,
  getMissingFieldsFromUrl,
  validateOidcProfile,
} from './authentication-service';

describe('authentication-service', () => {
  describe('validateOidcProfile', () => {
    it('should return success true for valid profile', () => {
      const profile: VidisProfile = {
        sub: 'user-123',
        sid: 'session-123',
        rolle: 'admin',
        schulkennung: 'school-123',
        bundesland: 'state-123',
      };
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
        missingFields: ['rolle', 'schulkennung', 'bundesland'],
      });
    });
  });

  describe('generateErrorUrl', () => {
    it('should generate correct error URL', () => {
      const missingFields = ['rolle', 'schulkennung'];
      const errorUrl = generateErrorUrl(missingFields);
      expect(errorUrl).toBe('/login/error?profile_error=rolle%2Cschulkennung');
    });
    it('should generate empty error URL if no missing fields are provided', () => {
      const missingFields: string[] = [];
      const errorUrl = generateErrorUrl(missingFields);
      expect(errorUrl).toBe('/login/error');
    });
  });

  describe('getMissingFieldsFromUrl', () => {
    it('should return missing fields from encoded URL search params', () => {
      const searchParams = {
        profile_error: 'rolle%2Cschulkennung',
      };
      const missingFields = getMissingFieldsFromUrl(searchParams);
      expect(missingFields).toEqual(['rolle', 'schulkennung']);
    });
    it('should return missing fields from decoded URL search params', () => {
      const searchParams = {
        profile_error: 'rolle,schulkennung',
      };
      const missingFields = getMissingFieldsFromUrl(searchParams);
      expect(missingFields).toEqual(['rolle', 'schulkennung']);
    });

    it('should return empty array if no profile_error param is present', () => {
      const searchParams = {
        other_param: 'value',
      };
      const missingFields = getMissingFieldsFromUrl(searchParams);
      expect(missingFields).toEqual([]);
    });

    it('should return empty array if profile_error is undefined', () => {
      const missingFields = getMissingFieldsFromUrl({ profile_error: undefined });
      expect(missingFields).toEqual([]);
    });
  });
});
