import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';

vi.mock('../db/functions/character', () => ({
  dbGetSharedCharacterConversations: vi.fn(),
  dbGetCharacterById: vi.fn(),
}));

import {
  deleteCharacter,
  deleteFileMappingAndEntity,
  fetchFileMappings,
  linkFileToCharacter,
  shareCharacter,
  unshareCharacter,
  updateCharacter,
  updateCharacterAccessLevel,
  updateCharacterPicture,
} from './character-service';
import { dbGetCharacterById, dbGetSharedCharacterConversations } from '../db/functions/character';
import { generateUUID } from '../utils/uuid';
import { CharacterSelectModel } from '@shared/db/schema';
import { ForbiddenError } from '@shared/error';

describe('Character Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteFileMappingAndEntity', () => {
    it('should throw because user is not the owner of the character', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await deleteFileMappingAndEntity({
            characterId: 'unimportant',
            fileId: 'unimportant',
            userId: 'differentUserId',
          }),
      ).rejects.toThrowError(ForbiddenError);
    });

    describe('fetchFileMappings', () => {
      it('should throw because character is private and user is not owner', async () => {
        const userId = generateUUID();
        const accessLevel = 'private';
        const mockCharacter: Partial<CharacterSelectModel> = {
          userId: userId,
          accessLevel: accessLevel,
        };

        (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
          mockCharacter as never,
        );

        await expect(
          async () =>
            await fetchFileMappings({
              characterId: 'unimportant',
              userId: 'differentUserId',
              schoolId: 'unimportant',
            }),
        ).rejects.toThrowError(ForbiddenError);
      });

      it('should throw because character access level is school and user is from different school', async () => {
        const userId = generateUUID();
        const accessLevel = 'school';
        const mockCharacter: Partial<CharacterSelectModel> = {
          userId: userId,
          schoolId: 'school-1',
          accessLevel: accessLevel,
        };

        (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
          mockCharacter as never,
        );

        await expect(
          async () =>
            await fetchFileMappings({
              characterId: 'unimportant',
              userId: userId,
              schoolId: 'differentSchoolId',
            }),
        ).rejects.toThrowError(ForbiddenError);
      });
    });
  });

  describe('linkFileToCharacter', () => {
    it('should throw because user is not owner of character', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await linkFileToCharacter({
            characterId: 'unimportant',
            userId: 'differentUserId',
            fileId: 'unimportant',
          }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('updateCharacterAccessLevel', () => {
    it('should throw because it is not allowed to set access level to global', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await updateCharacterAccessLevel({
            characterId: 'unimportant',
            userId: userId,
            accessLevel: 'global',
          }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw because user is not owner of character', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await updateCharacterAccessLevel({
            characterId: 'unimportant',
            userId: 'differentUserId',
            accessLevel: 'school',
          }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('updateCharacterPicture', () => {
    it('should throw because user is not owner of character', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await updateCharacterPicture({
            characterId: 'unimportant',
            userId: 'differentUserId',
            picturePath: 'unimportant',
          }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('updateCharacter', () => {
    it('should throw because user is not owner of character', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await updateCharacter({
            characterId: 'unimportant',
            userId: 'differentUserId',
            name: 'unimportant',
          }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('deleteCharacter', () => {
    it('should throw because user is not owner of character', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await deleteCharacter({
            characterId: 'unimportant',
            userId: 'differentUserId',
          }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('shareCharacter', () => {
    it('should throw because only teachers can share a character', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await shareCharacter({
            characterId: 'unimportant',
            user: { id: 'unimportant', userRole: 'student' },
            telliPointsPercentageLimit: 10,
            usageTimeLimitMinutes: 60,
          }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw because character is private and teacher is not owner', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await shareCharacter({
            characterId: 'unimportant',
            user: { id: 'differentUserId', userRole: 'teacher' },
            telliPointsPercentageLimit: 10,
            usageTimeLimitMinutes: 60,
          }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw because character access level is school and user is from different school', async () => {
      const userId = generateUUID();
      const accessLevel = 'school';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
        schoolId: 'school-1',
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await shareCharacter({
            characterId: 'unimportant',
            user: { id: userId, userRole: 'teacher' },
            telliPointsPercentageLimit: 10,
            usageTimeLimitMinutes: 60,
            schoolId: 'differentSchoolId',
          }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('unshareCharacter', () => {
    it('should throw because only teachers can unshare a character', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        async () =>
          await unshareCharacter({
            characterId: 'unimportant',
            user: { id: 'unimportant', userRole: 'student' },
          }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw because a user can only unshare a character they started sharing', async () => {
      const userId = generateUUID();
      const accessLevel = 'private';
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: accessLevel,
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );
      (
        dbGetSharedCharacterConversations as MockedFunction<
          typeof dbGetSharedCharacterConversations
        >
      ).mockResolvedValue([] as never);

      await expect(
        async () =>
          await unshareCharacter({
            characterId: 'unimportant',
            user: { id: 'differentUserId', userRole: 'teacher' },
          }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });
});
