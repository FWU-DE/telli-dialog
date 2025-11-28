import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import {
  createNewCustomGpt,
  deleteCustomGpt,
  deleteFileMappingAndEntity,
  getFileMappings,
  linkFileToCustomGpt,
  updateCustomGpt,
  updateCustomGptAccessLevel,
  updateCustomGptPicture,
} from './custom-gpt-service';
import { ForbiddenError } from '@shared/error';
import { generateUUID } from '@shared/utils/uuid';
import { dbGetCustomGptById } from '@shared/db/functions/custom-gpts';
import { CustomGptModel } from '@shared/db/schema';
import { UserModel } from '@shared/auth/user-model';

vi.mock('../db/functions/custom-gpts', () => ({
  dbGetCustomGptById: vi.fn(),
}));

describe('custom-gpt-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNewCustomGpt', () => {
    it('should throw because user is not a teacher', async () => {
      const userId = generateUUID();

      await expect(
        createNewCustomGpt({
          schoolId: 'unimportant',
          user: { id: userId, userRole: 'student' } as UserModel,
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('linkFileToCustomGpt', () => {
    it('should throw because user is not owner of the custom gpt', async () => {
      const userId = generateUUID();
      const mockCustomGpt: Partial<CustomGptModel> = { userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        linkFileToCustomGpt({
          customGptId: 'unimportant',
          fileId: 'unimportant',
          userId: 'differentId',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('deleteFileMappingAndEntity', () => {
    it('should throw because user is not owner of the custom gpt', async () => {
      const userId = generateUUID();
      const mockCustomGpt: Partial<CustomGptModel> = { userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        deleteFileMappingAndEntity({
          customGptId: 'unimportant',
          fileId: 'unimportant',
          userId: 'differentId',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('getFileMappings', () => {
    it('should throw because user is not owner of private custom gpt', async () => {
      const userId = generateUUID();
      const mockCustomGpt: Partial<CustomGptModel> = { accessLevel: 'private', userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        getFileMappings({
          customGptId: 'unimportant',
          schoolId: 'unimportant',
          userId: 'differentId',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw because user has not same schoolId as custom gpt', async () => {
      const userId = generateUUID();
      const mockCustomGpt: Partial<CustomGptModel> = {
        accessLevel: 'school',
        schoolId: 'school1',
        userId,
      };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        getFileMappings({
          customGptId: 'unimportant',
          schoolId: 'differentId',
          userId: 'differentId',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('updateCustomGptAccessLevel', () => {
    it('should throw because user is not owner of the custom gpt', async () => {
      const userId = generateUUID();
      const mockCustomGpt: Partial<CustomGptModel> = { userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        updateCustomGptAccessLevel({
          customGptId: 'unimportant',
          accessLevel: 'school',
          userId: 'differentId',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw because setting access level to global not possible', async () => {
      const userId = generateUUID();
      const mockCustomGpt: Partial<CustomGptModel> = { userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        updateCustomGptAccessLevel({
          customGptId: 'unimportant',
          accessLevel: 'global',
          userId: userId,
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('updateCustomGptPicture', () => {
    it('should throw because user is not owner of the custom gpt', async () => {
      const userId = generateUUID();
      const mockCustomGpt: Partial<CustomGptModel> = { userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        updateCustomGptPicture({
          customGptId: 'unimportant',
          picturePath: 'unimportant',
          userId: 'differentId',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('updateCustomGpt', () => {
    it('should throw because user is not owner of the custom gpt', async () => {
      const userId = generateUUID();
      const mockCustomGpt: Partial<CustomGptModel> = { userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        updateCustomGpt({
          customGptId: 'unimportant',
          userId: 'differentId',
          customGptProps: {},
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('deleteCustomGpt', () => {
    it('should throw because user is not owner of the custom gpt', async () => {
      const userId = generateUUID();
      const mockCustomGpt: Partial<CustomGptModel> = { userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        deleteCustomGpt({
          customGptId: 'unimportant',
          userId: 'differentId',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });
});
