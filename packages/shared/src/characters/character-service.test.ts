import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';

vi.mock('../db/functions/character', () => ({
  dbGetSharedCharacterConversations: vi.fn(),
  dbGetCharacterById: vi.fn(),
  dbGetCharacterByIdAndUserId: vi.fn(),
  dbGetCharacterByIdWithShareData: vi.fn(),
  dbDeleteCharacterByIdAndUserId: vi.fn(),
  dbGetCharactersBySchoolId: vi.fn(),
  dbGetCharactersByUserId: vi.fn(),
  dbGetGlobalCharacters: vi.fn(),
}));
vi.mock('../db/functions/files', () => ({
  dbGetRelatedCharacterFiles: vi.fn(),
}));
vi.mock('../s3', () => ({
  getReadOnlySignedUrl: vi.fn(),
}));

import {
  deleteCharacter,
  deleteFileMappingAndEntity,
  fetchFileMappings,
  getCharacterForChatSession,
  getCharacterForEditView,
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
  dbGetCharacterByIdWithShareData,
} from '../db/functions/character';
import { dbGetRelatedCharacterFiles } from '../db/functions/files';
import { getReadOnlySignedUrl } from '../s3';
import { generateUUID } from '../utils/uuid';
import { CharacterSelectModel } from '@shared/db/schema';
import { ForbiddenError, NotFoundError, InvalidArgumentError } from '@shared/error';

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
          dbGetCharacterByIdWithShareData as MockedFunction<typeof dbGetCharacterByIdWithShareData>
        ).mockResolvedValue(null as never);

        await expect(testFunction()).rejects.toThrowError(NotFoundError);
      },
    );

    it('should throw NotFoundError when character has no invite code - getSharedCharacter', async () => {
      const userId = generateUUID();
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
      };

      (
        dbGetCharacterByIdWithShareData as MockedFunction<typeof dbGetCharacterByIdWithShareData>
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
            id: generateUUID(),
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

  describe('InvalidArgumentError scenarios - invalid parameter format', () => {
    it.each([
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () =>
          deleteFileMappingAndEntity({
            characterId: 'invalid-uuid',
            fileId: generateUUID(),
            userId: 'user-id',
          }),
      },
      {
        functionName: 'fetchFileMappings',
        testFunction: () =>
          fetchFileMappings({
            characterId: 'invalid-uuid',
            userId: 'user-id',
            schoolId: 'school-id',
          }),
      },
      {
        functionName: 'linkFileToCharacter',
        testFunction: () =>
          linkFileToCharacter({
            characterId: 'invalid-uuid',
            userId: 'user-id',
            fileId: generateUUID(),
          }),
      },
      {
        functionName: 'updateCharacterPicture',
        testFunction: () =>
          updateCharacterPicture({
            characterId: 'invalid-uuid',
            userId: 'user-id',
            picturePath: 'picture-path',
          }),
      },
      {
        functionName: 'updateCharacter',
        testFunction: () =>
          updateCharacter({
            id: 'invalid-uuid',
            userId: 'user-id',
            name: 'new-name',
          }),
      },
      {
        functionName: 'deleteCharacter',
        testFunction: () =>
          deleteCharacter({
            characterId: 'invalid-uuid',
            userId: 'user-id',
          }),
      },
      {
        functionName: 'getSharedCharacter',
        testFunction: () =>
          getSharedCharacter({
            characterId: 'invalid-uuid',
            userId: 'user-id',
          }),
      },
    ])(
      'should throw InvalidArgumentError when characterId is not a valid UUID - $functionName',
      async ({ testFunction }) => {
        await expect(testFunction()).rejects.toThrowError(InvalidArgumentError);
      },
    );
  });

  describe('Link sharing bypass scenarios', () => {
    const characterId = generateUUID();
    const ownerUserId = generateUUID();
    const ownerSchoolId = generateUUID();
    const differentUserId = generateUUID();
    const differentSchoolId = generateUUID();

    describe('should allow access when isLinkShared is true - bypassing normal restrictions', () => {
      it.each([
        {
          accessLevel: 'private' as const,
          description: 'private character with link sharing enabled',
        },
        {
          accessLevel: 'school' as const,
          description: 'school character with link sharing enabled (different school)',
        },
      ])('getCharacterForChatSession - $description', async ({ accessLevel }) => {
        const mockCharacter = {
          id: characterId,
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel,
          isLinkShared: true,
        };

        (
          dbGetCharacterByIdWithShareData as MockedFunction<typeof dbGetCharacterByIdWithShareData>
        ).mockResolvedValue(mockCharacter as never);

        // User from different school trying to access - should succeed because isLinkShared is true
        const result = await getCharacterForChatSession({
          characterId,
          userId: differentUserId,
          schoolId: differentSchoolId,
        });

        expect(result).toBe(mockCharacter);
      });

      it.each([
        {
          accessLevel: 'private' as const,
          description: 'private character with link sharing enabled',
        },
        {
          accessLevel: 'school' as const,
          description: 'school character with link sharing enabled (different school)',
        },
      ])('getCharacterForEditView - $description', async ({ accessLevel }) => {
        const mockCharacter = {
          id: characterId,
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel,
          isLinkShared: true,
        };

        (
          dbGetCharacterByIdWithShareData as MockedFunction<typeof dbGetCharacterByIdWithShareData>
        ).mockResolvedValue(mockCharacter as never);
        // Also mock dbGetCharacterById because fetchFileMappings -> getCharacterInfo uses it
        (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
          mockCharacter as never,
        );
        (
          dbGetRelatedCharacterFiles as MockedFunction<typeof dbGetRelatedCharacterFiles>
        ).mockResolvedValue([]);
        (getReadOnlySignedUrl as MockedFunction<typeof getReadOnlySignedUrl>).mockResolvedValue(
          undefined,
        );

        // User from different school trying to access - should succeed because isLinkShared is true
        const result = await getCharacterForEditView({
          characterId,
          userId: differentUserId,
          schoolId: differentSchoolId,
        });

        expect(result.character).toBe(mockCharacter);
      });

      it.each([
        {
          accessLevel: 'private' as const,
          description: 'private character with link sharing enabled',
        },
        {
          accessLevel: 'school' as const,
          description: 'school character with link sharing enabled (different school)',
        },
      ])('fetchFileMappings - $description', async ({ accessLevel }) => {
        const mockCharacter: Partial<CharacterSelectModel> = {
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel,
          isLinkShared: true,
        };

        (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
          mockCharacter as never,
        );
        (
          dbGetRelatedCharacterFiles as MockedFunction<typeof dbGetRelatedCharacterFiles>
        ).mockResolvedValue([]);

        // Should not throw - access is allowed via link sharing
        await expect(
          fetchFileMappings({
            characterId,
            userId: differentUserId,
            schoolId: differentSchoolId,
          }),
        ).resolves.not.toThrow();
      });
    });

    describe('should still enforce restrictions when isLinkShared is false', () => {
      it('getCharacterForChatSession - private character without link sharing', async () => {
        const mockCharacter = {
          id: characterId,
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel: 'private' as const,
          isLinkShared: false,
        };

        (
          dbGetCharacterByIdWithShareData as MockedFunction<typeof dbGetCharacterByIdWithShareData>
        ).mockResolvedValue(mockCharacter as never);

        await expect(
          getCharacterForChatSession({
            characterId,
            userId: differentUserId,
            schoolId: differentSchoolId,
          }),
        ).rejects.toThrowError(ForbiddenError);
      });

      it('getCharacterForEditView - private character without link sharing', async () => {
        const mockCharacter = {
          id: characterId,
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel: 'private' as const,
          isLinkShared: false,
        };

        (
          dbGetCharacterByIdWithShareData as MockedFunction<typeof dbGetCharacterByIdWithShareData>
        ).mockResolvedValue(mockCharacter as never);

        await expect(
          getCharacterForEditView({
            characterId,
            userId: differentUserId,
            schoolId: differentSchoolId,
          }),
        ).rejects.toThrowError(ForbiddenError);
      });

      it('fetchFileMappings - private character without link sharing', async () => {
        const mockCharacter: Partial<CharacterSelectModel> = {
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel: 'private',
          isLinkShared: false,
        };

        (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
          mockCharacter as never,
        );

        await expect(
          fetchFileMappings({
            characterId,
            userId: differentUserId,
            schoolId: differentSchoolId,
          }),
        ).rejects.toThrowError(ForbiddenError);
      });
    });
  });
});
