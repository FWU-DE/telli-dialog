import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import {
  createNewAssistant,
  deleteAssistant,
  deleteFileMappingAndEntity,
  getAssistantByAccessLevel,
  getConversationWithMessagesAndAssistant,
  getAssistantForNewChat,
  getAssistantsByOverviewFilter,
  getFileMappings,
  linkFileToAssistant,
  updateAssistant,
  updateAssistantAccessLevel,
  getAssistantByUser,
  uploadAvatarPictureForAssistant,
  downloadFileFromAssistant,
} from './assistant-service';
import { ForbiddenError, NotFoundError, InvalidArgumentError } from '@shared/error';
import { generateUUID } from '@shared/utils/uuid';
import {
  dbGetAssistantById,
  dbGetGlobalGpts,
  dbGetGptsByAssociatedSchools,
  dbGetGptsByUser,
} from '@shared/db/functions/assistants';
import { dbGetRelatedAssistantFiles } from '@shared/db/functions/files';
import { AssistantSelectModel } from '@shared/db/schema';
import { UserModel } from '@shared/auth/user-model';
import {
  getConversation,
  getConversationMessages,
} from '@shared/conversation/conversation-service';
import { uploadFileToS3 } from '../s3';
import { getAvatarPictureUrl } from '../files/fileService';
import {
  copyAssistant,
  copyEntityPictureIfExists,
  copyRelatedTemplateFiles,
} from '../templates/template-service';

vi.mock('../db/functions/assistants', () => ({
  dbGetAssistantById: vi.fn(),
  dbGetGlobalGpts: vi.fn(),
  dbGetGptsByAssociatedSchools: vi.fn(),
  dbGetGptsByUser: vi.fn(),
}));
vi.mock('../db/functions/files', () => ({
  dbGetRelatedAssistantFiles: vi.fn(),
}));
vi.mock('../conversation/conversation-service', () => ({
  getConversation: vi.fn(),
  getConversationMessages: vi.fn(),
}));
vi.mock('../s3', () => ({
  uploadFileToS3: vi.fn(),
  deleteFileFromS3: vi.fn(),
  copyFileInS3: vi.fn(),
}));
vi.mock('../files/fileService', () => ({
  getAvatarPictureUrl: vi.fn(),
  deleteAvatarPicture: vi.fn(),
  deleteMessageAttachments: vi.fn(),
}));
vi.mock('../templates/template-service', () => ({
  copyAssistant: vi.fn(),
  copyRelatedTemplateFiles: vi.fn(),
  copyEntityPictureIfExists: vi.fn(),
}));
const { mockDbReturning, mockDbUpdate } = vi.hoisted(() => {
  const mockDbReturning = vi.fn();
  const mockDbWhere = vi.fn(() => ({ returning: mockDbReturning }));
  const mockDbSet = vi.fn(() => ({ where: mockDbWhere }));
  const mockDbUpdate = vi.fn(() => ({ set: mockDbSet }));
  return { mockDbReturning, mockDbUpdate };
});
vi.mock('@shared/db', () => ({ db: { update: mockDbUpdate } }));

const mockUser = (userRole: 'student' | 'teacher' = 'teacher'): UserModel => ({
  id: generateUUID(),
  lastUsedModel: null,
  versionAcceptedConditions: null,
  createdAt: new Date(),
  userRole,
  federalStateId: generateUUID(),
  schoolIds: [generateUUID()],
});

describe('assistant-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotFoundError scenarios', () => {
    const assistantId = generateUUID();
    const userId = generateUUID();
    const fileId = generateUUID();

    it.each([
      {
        functionName: 'getAssistantByUser',
        testFunction: () => getAssistantByUser({ assistantId, user: mockUser() }),
      },
      {
        functionName: 'getAssistantForNewChat',
        testFunction: () => getAssistantForNewChat({ assistantId, user: mockUser() }),
      },
      {
        functionName: 'linkFileToAssistant',
        testFunction: () => linkFileToAssistant({ assistantId, fileId, user: { id: userId } }),
      },
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () =>
          deleteFileMappingAndEntity({ assistantId, fileId, user: { id: userId } }),
      },
      {
        functionName: 'getFileMappings',
        testFunction: () => getFileMappings({ assistantId, user: mockUser() }),
      },
      {
        functionName: 'updateAssistantAccessLevel',
        testFunction: () =>
          updateAssistantAccessLevel({ assistantId, accessLevel: 'school', user: { id: userId } }),
      },
      {
        functionName: 'updateAssistant',
        testFunction: () =>
          updateAssistant({ assistantId, assistantProps: {}, user: { id: userId } }),
      },
      {
        functionName: 'deleteAssistant',
        testFunction: () => deleteAssistant({ assistantId, user: { id: userId, schoolIds: [] } }),
      },
      {
        functionName: 'uploadAvatarPictureForAssistant',
        testFunction: () =>
          uploadAvatarPictureForAssistant({
            assistantId,
            user: { id: 'different-user-id' },
            croppedImageBlob: new Blob(),
          }),
      },
      {
        functionName: 'downloadFileFromAssistant',
        testFunction: () =>
          downloadFileFromAssistant({
            assistantId,
            fileId,
            user: mockUser(),
          }),
      },
    ])(
      'should throw NotFoundError from dbGetAssistantById when assistant does not exist - $functionName',
      async ({ testFunction }) => {
        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockRejectedValue(
          new NotFoundError(),
        );

        await expect(testFunction()).rejects.toThrow(NotFoundError);
      },
    );

    it('should throw NotFoundError when conversation not found - getConversationWithMessagesAndAssistant', async () => {
      const userId = generateUUID();
      const assistantId = generateUUID();
      const conversationId = generateUUID();

      const mockAssistant: Partial<AssistantSelectModel> = { userId };

      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        mockAssistant as never,
      );
      (getConversation as MockedFunction<typeof getConversation>).mockRejectedValue(
        new NotFoundError('Conversation not found'),
      );
      (getConversationMessages as MockedFunction<typeof getConversationMessages>).mockResolvedValue(
        null as never,
      );

      await expect(
        getConversationWithMessagesAndAssistant({
          conversationId,
          assistantId,
          userId,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when assistant not found - getConversationWithMessagesAndAssistant', async () => {
      const userId = generateUUID();
      const assistantId = generateUUID();
      const conversationId = generateUUID();

      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockRejectedValue(
        new NotFoundError('assistant not found'),
      );
      (getConversation as MockedFunction<typeof getConversation>).mockResolvedValue(null as never);
      (getConversationMessages as MockedFunction<typeof getConversationMessages>).mockResolvedValue(
        null as never,
      );

      await expect(
        getConversationWithMessagesAndAssistant({
          conversationId,
          assistantId,
          userId,
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('ForbiddenError scenarios - user not owner', () => {
    const userId = generateUUID();
    const assistantId = generateUUID();
    const fileId = generateUUID();

    const mockAssistant: Partial<AssistantSelectModel> = {
      userId,
      accessLevel: 'private',
    };

    beforeEach(() => {
      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        mockAssistant as never,
      );
    });

    it.each([
      {
        functionName: 'getAssistantByUser',
        testFunction: () =>
          getAssistantByUser({
            assistantId,
            user: mockUser(),
          }),
      },
      {
        functionName: 'linkFileToAssistant',
        testFunction: () =>
          linkFileToAssistant({
            assistantId,
            fileId,
            user: { id: 'different-user-id' },
          }),
      },
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () =>
          deleteFileMappingAndEntity({
            assistantId,
            fileId,
            user: { id: 'different-user-id' },
          }),
      },
      {
        functionName: 'updateAssistantAccessLevel',
        testFunction: () =>
          updateAssistantAccessLevel({
            assistantId,
            accessLevel: 'school',
            user: { id: 'different-user-id' },
          }),
      },
      {
        functionName: 'updateAssistant',
        testFunction: () =>
          updateAssistant({
            assistantId,
            user: { id: 'different-user-id' },
            assistantProps: {},
          }),
      },
      {
        functionName: 'deleteAssistant',
        testFunction: () =>
          deleteAssistant({
            assistantId,
            user: { id: 'different-user-id', schoolIds: [] },
          }),
      },
      {
        functionName: 'uploadAvatarPictureForAssistant',
        testFunction: () =>
          uploadAvatarPictureForAssistant({
            assistantId,
            user: { id: 'different-user-id' },
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
    const userId = generateUUID();
    const assistantId = generateUUID();

    it.each([
      {
        functionName: 'getAssistantByUser',
        testFunction: () =>
          getAssistantByUser({
            assistantId,
            user: mockUser(),
          }),
      },
      {
        functionName: 'getAssistantForNewChat',
        testFunction: () =>
          getAssistantForNewChat({
            assistantId,
            user: mockUser(),
          }),
      },
    ])(
      'should throw ForbiddenError when user is not owner of private assistant - $functionName',
      async ({ testFunction }) => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId,
          accessLevel: 'private',
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        await expect(testFunction()).rejects.toThrow(ForbiddenError);
      },
    );

    it.each([
      {
        functionName: 'getAssistantByUser',
        testFunction: () =>
          getAssistantByUser({
            assistantId,
            user: mockUser(),
          }),
      },
      {
        functionName: 'getAssistantForNewChat',
        testFunction: () =>
          getAssistantForNewChat({
            assistantId,
            user: mockUser(),
          }),
      },
    ])(
      'should throw ForbiddenError when user is not in same school - $functionName',
      async ({ testFunction }) => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId,
          accessLevel: 'school',
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        await expect(testFunction()).rejects.toThrow(ForbiddenError);
      },
    );

    it('should throw ForbiddenError when user is not owner of conversation - getConversationWithMessagesAndAssistant', async () => {
      const userId = generateUUID();
      const assistantId = generateUUID();
      const conversationId = generateUUID();

      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        null as never,
      );
      (getConversation as MockedFunction<typeof getConversation>).mockRejectedValue(
        new ForbiddenError('Not authorized to access conversation'),
      );
      (getConversationMessages as MockedFunction<typeof getConversationMessages>).mockResolvedValue(
        null as never,
      );

      await expect(
        getConversationWithMessagesAndAssistant({
          conversationId,
          assistantId,
          userId,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when user is not owner of private assistant - getFileMappings', async () => {
      const userId = generateUUID();
      const assistantId = generateUUID();
      const mockAssistant: Partial<AssistantSelectModel> = { accessLevel: 'private', userId };

      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        mockAssistant as never,
      );

      await expect(
        getFileMappings({
          assistantId,
          user: mockUser(),
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when user has not same schoolId as assistant - getFileMappings', async () => {
      const userId = generateUUID();
      const assistantId = generateUUID();
      const mockAssistant: Partial<AssistantSelectModel> = {
        accessLevel: 'school',
        userId,
      };

      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        mockAssistant as never,
      );

      await expect(
        getFileMappings({
          assistantId,
          user: mockUser(),
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when setting access level to global not possible - updateAssistantAccessLevel', async () => {
      const userId = generateUUID();
      const assistantId = generateUUID();
      const mockAssistant: Partial<AssistantSelectModel> = { userId };

      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        mockAssistant as never,
      );

      await expect(
        updateAssistantAccessLevel({
          assistantId,
          accessLevel: 'global',
          user: { id: userId },
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('ForbiddenError scenarios - role restrictions', () => {
    it('should throw ForbiddenError when user is not a teacher - createNewAssistant', async () => {
      await expect(
        createNewAssistant({
          user: mockUser('student'),
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('createNewAssistant', () => {
    const templateId = generateUUID();
    const duplicatedAssistantName = 'Copy of Biology Assistant';

    beforeEach(() => {
      (
        copyRelatedTemplateFiles as MockedFunction<typeof copyRelatedTemplateFiles>
      ).mockResolvedValue(undefined as never);
    });

    it('should pass duplicateAssistantName to copyAssistant when creating from template', async () => {
      const insertedAssistant = {
        id: generateUUID(),
        pictureId: null,
      } as AssistantSelectModel;

      (copyAssistant as MockedFunction<typeof copyAssistant>).mockResolvedValue(
        insertedAssistant as never,
      );
      (
        copyEntityPictureIfExists as MockedFunction<typeof copyEntityPictureIfExists>
      ).mockResolvedValue(undefined as never);

      const result = await createNewAssistant({
        templateId,
        user: mockUser('teacher'),
        duplicateAssistantName: duplicatedAssistantName,
      });

      expect(copyAssistant).toHaveBeenCalledWith(
        templateId,
        'private',
        expect.objectContaining({ id: expect.any(String) }),
        duplicatedAssistantName,
      );
      expect(copyEntityPictureIfExists).toHaveBeenCalledWith({
        sourcePictureId: null,
        newEntityId: insertedAssistant.id,
        buildPictureKey: expect.any(Function),
      });
      expect(copyRelatedTemplateFiles).toHaveBeenCalledWith(
        'assistant',
        templateId,
        insertedAssistant.id,
      );
      expect(result).toBe(insertedAssistant);
    });

    it('should pass undefined duplicateAssistantName to copyAssistant when not provided', async () => {
      const insertedAssistant = {
        id: generateUUID(),
        pictureId: null,
      } as AssistantSelectModel;

      (copyAssistant as MockedFunction<typeof copyAssistant>).mockResolvedValue(
        insertedAssistant as never,
      );
      (
        copyEntityPictureIfExists as MockedFunction<typeof copyEntityPictureIfExists>
      ).mockResolvedValue(undefined as never);

      await createNewAssistant({
        templateId,
        user: mockUser('teacher'),
      });

      expect(copyAssistant).toHaveBeenCalledWith(
        templateId,
        'private',
        expect.objectContaining({ id: expect.any(String) }),
        undefined,
      );
    });

    it('should update assistant picture when template picture is copied', async () => {
      const insertedAssistant = {
        id: generateUUID(),
        pictureId: 'custom-gpts/template-id/original.png',
      } as AssistantSelectModel;
      const copiedPictureKey = `custom-gpts/${insertedAssistant.id}/original.png`;
      const updatedAssistant = {
        ...insertedAssistant,
        pictureId: copiedPictureKey,
      } as AssistantSelectModel;
      const user = mockUser('teacher');

      (copyAssistant as MockedFunction<typeof copyAssistant>).mockResolvedValue(
        insertedAssistant as never,
      );
      (
        copyEntityPictureIfExists as MockedFunction<typeof copyEntityPictureIfExists>
      ).mockResolvedValue(copiedPictureKey as never);
      mockDbReturning.mockResolvedValue([updatedAssistant]);

      const result = await createNewAssistant({
        templateId,
        user,
      });

      expect(copyEntityPictureIfExists).toHaveBeenCalledWith({
        sourcePictureId: insertedAssistant.pictureId,
        newEntityId: insertedAssistant.id,
        buildPictureKey: expect.any(Function),
      });
      expect(result).toEqual({ ...updatedAssistant, ownerSchoolIds: user.schoolIds });
    });

    it('should keep assistant unchanged when no copied picture key is returned', async () => {
      const insertedAssistant = {
        id: generateUUID(),
        pictureId: 'custom-gpts/template-id/original.png',
      } as AssistantSelectModel;

      (copyAssistant as MockedFunction<typeof copyAssistant>).mockResolvedValue(
        insertedAssistant as never,
      );
      (
        copyEntityPictureIfExists as MockedFunction<typeof copyEntityPictureIfExists>
      ).mockResolvedValue(undefined as never);

      const result = await createNewAssistant({
        templateId,
        user: mockUser('teacher'),
      });

      expect(result).toEqual(insertedAssistant);
    });
  });

  describe('InvalidArgumentError scenarios - invalid parameter format', () => {
    it.each([
      {
        functionName: 'getAssistantByUser',
        testFunction: () =>
          getAssistantByUser({
            assistantId: 'invalid-uuid',
            user: mockUser(),
          }),
      },
      {
        functionName: 'getAssistantForNewChat',
        testFunction: () =>
          getAssistantForNewChat({
            assistantId: 'invalid-uuid',
            user: mockUser(),
          }),
      },
      {
        functionName: 'getConversationWithMessagesAndAssistant',
        testFunction: () =>
          getConversationWithMessagesAndAssistant({
            assistantId: 'invalid-uuid',
            conversationId: generateUUID(),
            userId: 'user-id',
          }),
      },
      {
        functionName: 'getConversationWithMessagesAndAssistant (invalid conversationId)',
        testFunction: () =>
          getConversationWithMessagesAndAssistant({
            assistantId: generateUUID(),
            conversationId: 'invalid-uuid',
            userId: 'user-id',
          }),
      },
      {
        functionName: 'linkFileToAssistant',
        testFunction: () =>
          linkFileToAssistant({
            assistantId: 'invalid-uuid',
            fileId: generateUUID(),
            user: { id: 'user-id' },
          }),
      },
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () =>
          deleteFileMappingAndEntity({
            assistantId: 'invalid-uuid',
            fileId: generateUUID(),
            user: { id: 'user-id' },
          }),
      },
      {
        functionName: 'getFileMappings',
        testFunction: () =>
          getFileMappings({
            assistantId: 'invalid-uuid',
            user: mockUser(),
          }),
      },
      {
        functionName: 'updateAssistantAccessLevel',
        testFunction: () =>
          updateAssistantAccessLevel({
            assistantId: 'invalid-uuid',
            accessLevel: 'school',
            user: { id: 'user-id' },
          }),
      },
      {
        functionName: 'deleteAssistant',
        testFunction: () =>
          deleteAssistant({
            assistantId: 'invalid-uuid',
            user: { id: 'user-id', schoolIds: [] },
          }),
      },
    ])(
      'should throw InvalidArgumentError when parameter is not a valid UUID - $functionName',
      async ({ testFunction }) => {
        await expect(testFunction()).rejects.toThrow(InvalidArgumentError);
      },
    );
  });

  describe('getAssistantForNewChat', () => {
    const assistantId = generateUUID();
    const ownerUser = mockUser();
    const differentUser = mockUser();

    describe.each([
      { accessLevel: 'private' as const, user: ownerUser },
      { accessLevel: 'global' as const, user: differentUser },
    ])('accessLevel=$accessLevel', ({ accessLevel, user }) => {
      it(`should return assistant with accessLevel=${accessLevel} - getAssistantForNewChat`, async () => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: ownerUser.id,
          accessLevel,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        const assistant = await getAssistantForNewChat({
          assistantId,
          user,
        });

        expect(assistant).toBe(mockAssistant);
      });
    });
  });

  describe('getAssistantByUser', () => {
    const assistantId = generateUUID();
    const ownerUser = mockUser();
    const differentUser = mockUser();

    describe.each([
      { accessLevel: 'private' as const, user: ownerUser },
      { accessLevel: 'global' as const, user: differentUser },
    ])('accessLevel=$accessLevel', ({ accessLevel, user }) => {
      it(`should return assistant with accessLevel=${accessLevel} - getAssistantByUser`, async () => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: ownerUser.id,
          accessLevel,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        const { assistant } = await getAssistantByUser({
          assistantId,
          user,
        });

        expect(assistant).toBe(mockAssistant);
      });
    });
  });

  describe('Link sharing bypass scenarios', () => {
    const assistantId = generateUUID();
    const ownerUserId = generateUUID();

    describe('should allow access when hasLinkAccess is true - bypassing normal restrictions', () => {
      it.each([
        {
          accessLevel: 'private' as const,
          description: 'private assistant with link sharing enabled',
        },
        {
          accessLevel: 'school' as const,
          description: 'school assistant with link sharing enabled (different school)',
        },
      ])('getAssistantByUser - $description', async ({ accessLevel }) => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: ownerUserId,
          accessLevel,
          hasLinkAccess: true,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        // User from different school trying to access - should succeed because hasLinkAccess is true
        const result = await getAssistantByUser({
          assistantId,
          user: mockUser(),
        });

        expect(result.assistant).toBe(mockAssistant);
      });

      it.each([
        {
          accessLevel: 'private' as const,
          description: 'private assistant with link sharing enabled',
        },
        {
          accessLevel: 'school' as const,
          description: 'school assistant with link sharing enabled (different school)',
        },
      ])('getAssistantForNewChat - $description', async ({ accessLevel }) => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: ownerUserId,
          accessLevel,
          hasLinkAccess: true,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        // User from different school trying to access - should succeed because hasLinkAccess is true
        const result = await getAssistantForNewChat({
          assistantId,
          user: mockUser(),
        });

        expect(result).toBe(mockAssistant);
      });

      it.each([
        {
          accessLevel: 'private' as const,
          description: 'private assistant with link sharing enabled',
        },
        {
          accessLevel: 'school' as const,
          description: 'school assistant with link sharing enabled (different school)',
        },
      ])('getFileMappings - $description', async ({ accessLevel }) => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: ownerUserId,
          accessLevel,
          hasLinkAccess: true,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );
        (
          dbGetRelatedAssistantFiles as MockedFunction<typeof dbGetRelatedAssistantFiles>
        ).mockResolvedValue([]);

        // Should not throw - access is allowed via link sharing
        await expect(
          getFileMappings({
            assistantId,
            user: mockUser(),
          }),
        ).resolves.not.toThrow();
      });
    });

    describe('should still enforce restrictions when hasLinkAccess is false', () => {
      it('getAssistantByUser - private assistant without link sharing', async () => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: ownerUserId,
          accessLevel: 'private',
          hasLinkAccess: false,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        await expect(
          getAssistantByUser({
            assistantId,
            user: mockUser(),
          }),
        ).rejects.toThrow(ForbiddenError);
      });

      it('getAssistantForNewChat - private assistant without link sharing', async () => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: ownerUserId,
          accessLevel: 'private',
          hasLinkAccess: false,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        await expect(
          getAssistantForNewChat({
            assistantId,
            user: mockUser(),
          }),
        ).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe('assistant discovery filters', () => {
    const user = mockUser('teacher');
    const assistants = [{ id: generateUUID() } as AssistantSelectModel];

    it.each([
      {
        accessLevel: 'global' as const,
        expectedMock: dbGetGlobalGpts,
      },
      {
        accessLevel: 'school' as const,
        expectedMock: dbGetGptsByAssociatedSchools,
      },
      {
        accessLevel: 'private' as const,
        expectedMock: dbGetGptsByUser,
      },
    ])(
      'routes accessLevel=$accessLevel to the correct db function',
      async ({ accessLevel, expectedMock }) => {
        (expectedMock as MockedFunction<typeof expectedMock>).mockResolvedValue(
          assistants as never,
        );

        const result = await getAssistantByAccessLevel({ accessLevel, user });

        expect(result).toEqual(assistants);
        expect(expectedMock).toHaveBeenCalledWith({ user });
      },
    );

    it('returns an empty list for unsupported access levels', async () => {
      const result = await getAssistantByAccessLevel({
        accessLevel: 'invalid' as never,
        user,
      });

      expect(result).toEqual([]);
    });

    it('returns combined lists for filter=all', async () => {
      const privateAssistant = { id: generateUUID() } as AssistantSelectModel;
      const schoolAssistant = { id: generateUUID() } as AssistantSelectModel;
      const officialAssistant = { id: generateUUID() } as AssistantSelectModel;

      (dbGetGptsByUser as MockedFunction<typeof dbGetGptsByUser>).mockResolvedValue([
        privateAssistant,
      ] as never);
      (
        dbGetGptsByAssociatedSchools as MockedFunction<typeof dbGetGptsByAssociatedSchools>
      ).mockResolvedValue([schoolAssistant] as never);
      (dbGetGlobalGpts as MockedFunction<typeof dbGetGlobalGpts>).mockResolvedValue([
        officialAssistant,
      ] as never);

      const result = await getAssistantsByOverviewFilter({ filter: 'all', user });

      expect(result).toEqual([privateAssistant, schoolAssistant, officialAssistant]);
    });

    it.each([
      { filter: 'mine' as const, expectedMock: dbGetGptsByUser },
      { filter: 'official' as const, expectedMock: dbGetGlobalGpts },
      { filter: 'school' as const, expectedMock: dbGetGptsByAssociatedSchools },
    ])('routes filter=$filter to the correct db function', async ({ filter, expectedMock }) => {
      (expectedMock as MockedFunction<typeof expectedMock>).mockResolvedValue(assistants as never);

      const result = await getAssistantsByOverviewFilter({ filter, user });

      expect(result).toEqual(assistants);
      expect(expectedMock).toHaveBeenCalledWith({ user });
    });

    it('returns an empty list for unsupported overview filters', async () => {
      const result = await getAssistantsByOverviewFilter({
        filter: 'invalid' as never,
        user,
      });

      expect(result).toEqual([]);
    });
  });

  describe('uploadAvatarPictureForAssistant', () => {
    const assistantId = generateUUID();
    const userId = generateUUID();

    beforeEach(() => {
      const mockAssistant: Partial<AssistantSelectModel> = {
        id: assistantId,
        userId,
        accessLevel: 'private',
        pictureId: null,
      };
      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        mockAssistant as never,
      );
      (uploadFileToS3 as MockedFunction<typeof uploadFileToS3>).mockResolvedValue(
        undefined as never,
      );
      mockDbReturning.mockResolvedValue([
        { id: assistantId, userId, pictureId: `custom-gpts/${assistantId}/avatar_abc123` },
      ]);
      (getAvatarPictureUrl as MockedFunction<typeof getAvatarPictureUrl>).mockResolvedValue(
        'https://signed-url',
      );
    });

    it('should upload avatar, update db and return picturePath and signedUrl', async () => {
      const result = await uploadAvatarPictureForAssistant({
        assistantId,
        user: { id: userId },
        croppedImageBlob: new Blob(['data'], { type: 'image/png' }),
      });

      expect(uploadFileToS3).toHaveBeenCalled();
      expect(result).toEqual({
        picturePath: `custom-gpts/${assistantId}/avatar_3a6eb0790f39`,
        signedUrl: 'https://signed-url',
      });
    });
  });
});
