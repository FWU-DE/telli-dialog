import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import {
  createNewCharacter,
  deleteCharacter,
  deleteFileMappingAndEntity,
  downloadFileFromCharacter,
  fetchFileMappings,
  getCharacterForChatSession,
  getCharacterForEditView,
  getSharedCharacter,
  linkFileToCharacter,
  shareCharacter,
  unshareCharacter,
  updateCharacter,
  updateCharacterAccessLevel,
  uploadAvatarPictureForCharacter,
} from './character-service';
import {
  dbGetCharacterById,
  dbGetCharacterByIdOptionalShareData,
  dbGetCharacterByIdWithShareData,
  dbGetSharedCharacterConversations,
} from '../db/functions/character';
import { dbGetRelatedCharacterFiles } from '../db/functions/files';
import { getReadOnlySignedUrl, uploadFileToS3 } from '../s3';
import { getAvatarPictureUrl } from '../files/fileService';
import { generateUUID } from '../utils/uuid';
import { CharacterSelectModel } from '@shared/db/schema';
import { ForbiddenError, InvalidArgumentError, NotFoundError } from '@shared/error';
import {
  copyCharacter,
  copyEntityPictureIfExists,
  copyRelatedTemplateFiles,
} from '../templates/template-service';
import { dbGetUserIdsWithSharedSchools } from '@shared/db/helpers/school-sharing';

vi.mock('../db/functions/character', () => ({
  dbGetSharedCharacterConversations: vi.fn(),
  dbGetCharacterById: vi.fn(),
  dbGetCharacterByIdAndUserId: vi.fn(),
  dbGetCharacterByIdOptionalShareData: vi.fn(),
  dbGetCharacterByIdWithShareData: vi.fn(),
  dbDeleteCharacterByIdAndUserId: vi.fn(),
  dbGetCharactersByAssociatedSchools: vi.fn(),
  dbGetCharactersByUserId: vi.fn(),
  dbGetGlobalCharacters: vi.fn(),
}));
vi.mock('../db/functions/files', () => ({
  dbGetRelatedCharacterFiles: vi.fn(),
}));
vi.mock('../s3', () => ({
  getReadOnlySignedUrl: vi.fn(),
  uploadFileToS3: vi.fn(),
  deleteFileFromS3: vi.fn(),
}));
vi.mock('../files/fileService', () => ({
  getAvatarPictureUrl: vi.fn(),
  deleteAvatarPicture: vi.fn(),
  deleteMessageAttachments: vi.fn(),
}));
vi.mock('../templates/template-service', () => ({
  copyCharacter: vi.fn(),
  copyEntityPictureIfExists: vi.fn(),
  copyRelatedTemplateFiles: vi.fn(),
}));
vi.mock('@shared/db/helpers/school-sharing', () => ({
  dbGetUserIdsWithSharedSchools: vi.fn(),
}));
const { mockDbReturning, mockDbUpdate } = vi.hoisted(() => {
  const mockDbReturning = vi.fn();
  const mockDbWhere = vi.fn(() => ({ returning: mockDbReturning }));
  const mockDbSet = vi.fn(() => ({ where: mockDbWhere }));
  const mockDbUpdate = vi.fn(() => ({ set: mockDbSet }));
  return { mockDbReturning, mockDbUpdate };
});
vi.mock('@shared/db', () => ({ db: { update: mockDbUpdate } }));

const mockUser = (userRole: 'student' | 'teacher' = 'teacher') => ({
  id: generateUUID(),
  userRole,
  lastUsedModel: null,
  versionAcceptedConditions: null,
  createdAt: new Date(),
  federalStateId: generateUUID(),
  schoolIds: [generateUUID()],
});

describe('character-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (
      dbGetUserIdsWithSharedSchools as MockedFunction<typeof dbGetUserIdsWithSharedSchools>
    ).mockResolvedValue([]);
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
      {
        functionName: 'downloadFileFromCharacter',
        testFunction: () =>
          downloadFileFromCharacter({
            characterId: generateUUID(),
            fileId: generateUUID(),
            user: mockUser(),
          }),
      },
    ])(
      'should throw NotFoundError when character does not exist - $functionName',
      async ({ testFunction }) => {
        (
          dbGetCharacterByIdWithShareData as MockedFunction<typeof dbGetCharacterByIdWithShareData>
        ).mockResolvedValue(null as never);

        await expect(testFunction()).rejects.toThrow(NotFoundError);
      },
    );

    it('should throw NotFoundError when character does not exist - uploadAvatarPictureForCharacter', async () => {
      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        null as never,
      );

      await expect(
        uploadAvatarPictureForCharacter({
          characterId: generateUUID(),
          userId: 'user-id',
          croppedImageBlob: new Blob(),
        }),
      ).rejects.toThrow(NotFoundError);
    });

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
      ).rejects.toThrow(NotFoundError);
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
      {
        functionName: 'uploadAvatarPictureForCharacter',
        testFunction: () =>
          uploadAvatarPictureForCharacter({
            characterId: generateUUID(),
            userId: 'different-user-id',
            croppedImageBlob: new Blob(),
          }),
      },
    ])(
      'should throw ForbiddenError when user is not the owner - $functionName',
      async ({ testFunction }) => {
        await expect(testFunction()).rejects.toThrow(ForbiddenError);
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
      ).rejects.toThrow(ForbiddenError);
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
      ).rejects.toThrow(ForbiddenError);
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
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when character access level is school and user is from different school - fetchFileMappings', async () => {
      const userId = generateUUID();
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: 'school',
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );
      (
        dbGetUserIdsWithSharedSchools as MockedFunction<typeof dbGetUserIdsWithSharedSchools>
      ).mockResolvedValue([]);

      await expect(
        fetchFileMappings({
          characterId: generateUUID(),
          userId: 'different-user-id',
        }),
      ).rejects.toThrow(ForbiddenError);
    });
    it('should allow access when character access level is school and users share school - fetchFileMappings', async () => {
      const characterId = generateUUID();
      const ownerUserId = generateUUID();
      const viewerUserId = generateUUID();

      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: ownerUserId,
        accessLevel: 'school',
      };

      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );
      (
        dbGetUserIdsWithSharedSchools as MockedFunction<typeof dbGetUserIdsWithSharedSchools>
      ).mockResolvedValue([ownerUserId]);
      (
        dbGetRelatedCharacterFiles as MockedFunction<typeof dbGetRelatedCharacterFiles>
      ).mockResolvedValue([]);

      await expect(
        fetchFileMappings({
          characterId,
          userId: viewerUserId,
        }),
      ).resolves.toEqual([]);

      expect(dbGetUserIdsWithSharedSchools).toHaveBeenCalledWith(viewerUserId);
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
      await expect(testFunction()).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when character is private and teacher is not owner - shareCharacter', async () => {
      await expect(
        shareCharacter({
          characterId: generateUUID(),
          user: mockUser('teacher'),
          telliPointsPercentageLimit: 10,
          usageTimeLimitMinutes: 60,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when character access level is school and user is from different school - shareCharacter', async () => {
      const userId = generateUUID();
      const mockCharacter: Partial<CharacterSelectModel> = {
        userId: userId,
        accessLevel: 'school',
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
        }),
      ).rejects.toThrow(ForbiddenError);
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
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('createNewCharacter', () => {
    const federalStateId = generateUUID();
    const templateId = generateUUID();
    const duplicateCharacterName = 'Copied Character';

    beforeEach(() => {
      (
        copyRelatedTemplateFiles as MockedFunction<typeof copyRelatedTemplateFiles>
      ).mockResolvedValue(undefined as never);
    });

    it('should pass duplicateCharacterName to copyCharacter when creating from template', async () => {
      const insertedCharacter = {
        id: generateUUID(),
        pictureId: null,
      } as CharacterSelectModel;

      (copyCharacter as MockedFunction<typeof copyCharacter>).mockResolvedValue(
        insertedCharacter as never,
      );
      (
        copyEntityPictureIfExists as MockedFunction<typeof copyEntityPictureIfExists>
      ).mockResolvedValue(undefined as never);

      const result = await createNewCharacter({
        federalStateId,
        templateId,
        user: mockUser('teacher'),
        duplicateCharacterName,
      });

      expect(copyCharacter).toHaveBeenCalledWith(
        templateId,
        'private',
        expect.any(String),
        duplicateCharacterName,
      );
      expect(copyEntityPictureIfExists).toHaveBeenCalledWith({
        sourcePictureId: null,
        newEntityId: insertedCharacter.id,
        buildPictureKey: expect.any(Function),
      });
      expect(copyRelatedTemplateFiles).toHaveBeenCalledWith(
        'character',
        templateId,
        insertedCharacter.id,
      );
      expect(result).toBe(insertedCharacter);
    });

    it('should update character picture when template picture is copied', async () => {
      const insertedCharacter = {
        id: generateUUID(),
        pictureId: 'characters/template-id/original.png',
      } as CharacterSelectModel;
      const copiedPictureKey = `characters/${insertedCharacter.id}/original.png`;
      const updatedCharacter = {
        ...insertedCharacter,
        pictureId: copiedPictureKey,
      } as CharacterSelectModel;

      (copyCharacter as MockedFunction<typeof copyCharacter>).mockResolvedValue(
        insertedCharacter as never,
      );
      (
        copyEntityPictureIfExists as MockedFunction<typeof copyEntityPictureIfExists>
      ).mockResolvedValue(copiedPictureKey as never);
      mockDbReturning.mockResolvedValue([updatedCharacter]);

      const result = await createNewCharacter({
        federalStateId,
        templateId,
        user: mockUser('teacher'),
      });

      expect(result).toEqual(updatedCharacter);
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
      {
        functionName: 'uploadAvatarPictureForCharacter',
        testFunction: () =>
          uploadAvatarPictureForCharacter({
            characterId: 'invalid-uuid',
            userId: 'user-id',
            croppedImageBlob: new Blob(),
          }),
      },
    ])(
      'should throw InvalidArgumentError when characterId is not a valid UUID - $functionName',
      async ({ testFunction }) => {
        await expect(testFunction()).rejects.toThrow(InvalidArgumentError);
      },
    );
  });

  describe('Link sharing bypass scenarios', () => {
    const characterId = generateUUID();
    const ownerUserId = generateUUID();
    const differentUserId = generateUUID();

    describe('should allow access when hasLinkAccess is true - bypassing normal restrictions', () => {
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
          accessLevel,
          hasLinkAccess: true,
        };

        (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
          mockCharacter as never,
        );

        // User from different school trying to access - should succeed because hasLinkAccess is true
        const result = await getCharacterForChatSession({
          characterId,
          userId: differentUserId,
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
          accessLevel,
          hasLinkAccess: true,
        };

        (
          dbGetCharacterByIdOptionalShareData as MockedFunction<
            typeof dbGetCharacterByIdOptionalShareData
          >
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

        // User from different school trying to access - should succeed because hasLinkAccess is true
        const result = await getCharacterForEditView({
          characterId,
          userId: differentUserId,
        });

        expect(result.character).toBe(mockCharacter);
      });
      it('getCharacterForChatSession - school character without link sharing but shared school', async () => {
        const mockCharacter = {
          id: characterId,
          userId: ownerUserId,
          accessLevel: 'school' as const,
          hasLinkAccess: false,
        };

        (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
          mockCharacter as never,
        );
        (
          dbGetUserIdsWithSharedSchools as MockedFunction<typeof dbGetUserIdsWithSharedSchools>
        ).mockResolvedValue([ownerUserId]);

        const result = await getCharacterForChatSession({
          characterId,
          userId: differentUserId,
        });

        expect(result).toBe(mockCharacter);
        expect(dbGetUserIdsWithSharedSchools).toHaveBeenCalledWith(differentUserId);
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
          accessLevel,
          hasLinkAccess: true,
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
          }),
        ).resolves.not.toThrow();
      });
    });

    describe('should still enforce restrictions when hasLinkAccess is false', () => {
      it('getCharacterForChatSession - private character without link sharing', async () => {
        const mockCharacter = {
          id: characterId,
          userId: ownerUserId,
          accessLevel: 'private' as const,
          hasLinkAccess: false,
        };

        (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
          mockCharacter as never,
        );

        await expect(
          getCharacterForChatSession({
            characterId,
            userId: differentUserId,
          }),
        ).rejects.toThrow(ForbiddenError);
      });

      it('getCharacterForEditView - private character without link sharing', async () => {
        const mockCharacter = {
          id: characterId,
          userId: ownerUserId,
          accessLevel: 'private' as const,
          hasLinkAccess: false,
        };

        (
          dbGetCharacterByIdOptionalShareData as MockedFunction<
            typeof dbGetCharacterByIdOptionalShareData
          >
        ).mockResolvedValue(mockCharacter as never);

        await expect(
          getCharacterForEditView({
            characterId,
            userId: differentUserId,
          }),
        ).rejects.toThrow(ForbiddenError);
      });

      it('fetchFileMappings - private character without link sharing', async () => {
        const mockCharacter: Partial<CharacterSelectModel> = {
          userId: ownerUserId,
          accessLevel: 'private',
          hasLinkAccess: false,
        };

        (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
          mockCharacter as never,
        );

        await expect(
          fetchFileMappings({
            characterId,
            userId: differentUserId,
          }),
        ).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe('uploadAvatarPictureForCharacter', () => {
    const characterId = generateUUID();
    const userId = generateUUID();

    beforeEach(() => {
      const mockCharacter: Partial<CharacterSelectModel> = {
        id: characterId,
        userId,
        accessLevel: 'private',
        pictureId: null,
      };
      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue(
        mockCharacter as never,
      );
      (uploadFileToS3 as MockedFunction<typeof uploadFileToS3>).mockResolvedValue(
        undefined as never,
      );
      mockDbReturning.mockResolvedValue([
        { id: characterId, userId, pictureId: `characters/${characterId}/avatar_abc123` },
      ]);
      (getAvatarPictureUrl as MockedFunction<typeof getAvatarPictureUrl>).mockResolvedValue(
        'https://signed-url',
      );
    });

    it('should upload avatar, update db and return picturePath and signedUrl', async () => {
      const result = await uploadAvatarPictureForCharacter({
        characterId,
        userId,
        croppedImageBlob: new Blob(['data'], { type: 'image/png' }),
      });

      expect(uploadFileToS3).toHaveBeenCalled();
      expect(result).toEqual({
        picturePath: `characters/${characterId}/avatar_3a6eb0790f39`,
        signedUrl: 'https://signed-url',
      });
    });
  });
});
