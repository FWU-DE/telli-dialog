import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';

vi.mock('../db/functions/character', () => ({
  dbGetSharedCharacterConversations: vi.fn(),
  dbGetCharacterById: vi.fn(),
  dbGetCharacterByIdAndUserId: vi.fn(),
}));

import {
  deleteCharacter,
  deleteFileMappingAndEntity,
  fetchFileMappings,
  getSharedCharacter,
  linkFileToCharacter,
  shareCharacter,
  unshareCharacter,
  updateCharacter,
  updateCharacterAccessLevel,
  updateCharacterPicture,
} from './character-service';
import {
  dbGetCharacterById,
  dbGetSharedCharacterConversations,
  dbGetCharacterByIdAndUserId,
} from '../db/functions/character';
import { generateUUID } from '../utils/uuid';
import { CharacterSelectModel } from '@shared/db/schema';
import { ForbiddenError, NotFoundError } from '@shared/error';

const mockUser = (userRole: 'student' | 'teacher' = 'teacher') => ({
  id: generateUUID(),
  userRole,
});

describe('character-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotFoundError scenarios', () => {
    it.each([
      {
        functionName: 'getSharedCharacter',
        testFunction: () =>
          getSharedCharacter({
            characterId: generateUUID(),
            userId: 'user-id',
          }),
      },
    ])(
      'should throw NotFoundError when character does not exist - $functionName',
      async ({ testFunction }) => {
        (
          dbGetCharacterByIdAndUserId as MockedFunction<typeof dbGetCharacterByIdAndUserId>
        ).mockResolvedValue(null as never);

        await expect(testFunction()).rejects.toThrowError(NotFoundError);
      },
    );

    it('should throw NotFoundError when character has no invite code - getSharedCharacter', async () => {
      const userId = generateUUID();
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        inviteCode: null,
      };

      (
        dbGetCharacterByIdAndUserId as MockedFunction<typeof dbGetCharacterByIdAndUserId>
      ).mockResolvedValue(mockCharacter as never);

      await expect(
        getSharedCharacter({
          characterId: generateUUID(),
          userId: 'user-id',
        }),
      ).rejects.toThrowError(NotFoundError);
    });
  });

  describe('ForbiddenError scenarios - user not owner', () => {
    const userId = generateUUID();
    const mockCharacter: Partial<CharacterSelectModel> = {
      userId: userId,
      accessLevel: 'private',
    };

    beforeEach(() => {
      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );
    });

    it.each([
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () =>
          deleteFileMappingAndEntity({
            characterId: generateUUID(),
            fileId: generateUUID(),
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'linkFileToCharacter',
        testFunction: () =>
          linkFileToCharacter({
            characterId: generateUUID(),
            userId: 'different-user-id',
            fileId: generateUUID(),
          }),
      },
      {
        functionName: 'updateCharacterPicture',
        testFunction: () =>
          updateCharacterPicture({
            characterId: generateUUID(),
            userId: 'different-user-id',
            picturePath: 'picture-path',
          }),
      },
      {
        functionName: 'updateCharacter',
        testFunction: () =>
          updateCharacter({
            characterId: generateUUID(),
            userId: 'different-user-id',
            name: 'new-name',
          }),
      },
      {
        functionName: 'deleteCharacter',
        testFunction: () =>
          deleteCharacter({
            characterId: generateUUID(),
            userId: 'different-user-id',
          }),
      },
    ])(
      'should throw ForbiddenError when user is not the owner - $functionName',
      async ({ testFunction }) => {
        await expect(testFunction()).rejects.toThrowError(ForbiddenError);
      },
    );
  });

  describe('ForbiddenError scenarios - access restrictions', () => {
    it('should throw ForbiddenError when setting access level to global - updateCharacterAccessLevel', async () => {
      const userId = generateUUID();
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: 'private',
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        updateCharacterAccessLevel({
          characterId: generateUUID(),
          userId: userId,
          accessLevel: 'global',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw ForbiddenError when user is not owner - updateCharacterAccessLevel', async () => {
      const userId = generateUUID();
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: 'private',
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        updateCharacterAccessLevel({
          characterId: generateUUID(),
          userId: 'different-user-id',
          accessLevel: 'school',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw ForbiddenError when character is private and user is not owner - fetchFileMappings', async () => {
      const userId = generateUUID();
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: 'private',
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        fetchFileMappings({
          characterId: generateUUID(),
          userId: 'different-user-id',
          schoolId: 'school-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw ForbiddenError when character access level is school and user is from different school - fetchFileMappings', async () => {
      const userId = generateUUID();
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        schoolId: 'school-1',
        accessLevel: 'school',
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        fetchFileMappings({
          characterId: generateUUID(),
          userId: 'different-user-id',
          schoolId: 'different-school-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('ForbiddenError scenarios - role restrictions', () => {
    beforeEach(() => {
      const userId = generateUUID();
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: 'private',
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );
    });

    it.each([
      {
        functionName: 'shareCharacter',
        testFunction: () =>
          shareCharacter({
            characterId: generateUUID(),
            user: mockUser('student'),
            telliPointsPercentageLimit: 10,
            usageTimeLimitMinutes: 60,
          }),
        reason: 'only teachers can share a character',
      },
      {
        functionName: 'unshareCharacter',
        testFunction: () =>
          unshareCharacter({
            characterId: generateUUID(),
            user: mockUser('student'),
          }),
        reason: 'only teachers can unshare a character',
      },
    ])('should throw ForbiddenError because $reason - $functionName', async ({ testFunction }) => {
      await expect(testFunction()).rejects.toThrowError(ForbiddenError);
    });

    it('should throw ForbiddenError when character is private and teacher is not owner - shareCharacter', async () => {
      await expect(
        shareCharacter({
          characterId: generateUUID(),
          user: mockUser('teacher'),
          telliPointsPercentageLimit: 10,
          usageTimeLimitMinutes: 60,
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw ForbiddenError when character access level is school and user is from different school - shareCharacter', async () => {
      const userId = generateUUID();
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: 'school',
        schoolId: 'school-1',
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );

      await expect(
        shareCharacter({
          characterId: generateUUID(),
          user: mockUser('teacher'),
          telliPointsPercentageLimit: 10,
          usageTimeLimitMinutes: 60,
          schoolId: 'different-school-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw ForbiddenError when user can only unshare a character they started sharing - unshareCharacter', async () => {
      (
        dbGetSharedCharacterConversations as MockedFunction<
          typeof dbGetSharedCharacterConversations
        >
      ).mockResolvedValue([] as never);

      await expect(
        unshareCharacter({
          characterId: generateUUID(),
          user: mockUser('teacher'),
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });
});
