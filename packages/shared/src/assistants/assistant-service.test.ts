import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import {
  createNewAssistant,
  deleteAssistant,
  deleteFileMappingAndEntity,
  getConversationWithMessagesAndAssistant,
  getAssistantForNewChat,
  getFileMappings,
  linkFileToAssistant,
  updateAssistant,
  updateAssistantAccessLevel,
  getAssistantByUser,
  uploadAvatarPictureForAssistant,
} from './assistant-service';
import { ForbiddenError, NotFoundError, InvalidArgumentError } from '@shared/error';
import { generateUUID } from '@shared/utils/uuid';
import { dbGetAssistantById } from '@shared/db/functions/assistants';
import { dbGetRelatedAssistantFiles } from '@shared/db/functions/files';
import { AssistantSelectModel } from '@shared/db/schema';
import { UserModel } from '@shared/auth/user-model';
import {
  getConversation,
  getConversationMessages,
} from '@shared/conversation/conversation-service';
import { uploadFileToS3 } from '../s3';
import { getAvatarPictureUrl } from '../files/fileService';

vi.mock('../db/functions/assistants', () => ({
  dbGetAssistantById: vi.fn(),
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
});

describe('assistant-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotFoundError scenarios', () => {
    const assistantId = generateUUID();
    const schoolId = generateUUID();
    const userId = generateUUID();
    const fileId = generateUUID();

    it.each([
      {
        functionName: 'getAssistantByUser',
        testFunction: () => getAssistantByUser({ assistantId, schoolId, userId }),
      },
      {
        functionName: 'getAssistantForNewChat',
        testFunction: () => getAssistantForNewChat({ assistantId, schoolId, userId }),
      },
      {
        functionName: 'linkFileToAssistant',
        testFunction: () => linkFileToAssistant({ assistantId, fileId, userId }),
      },
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () => deleteFileMappingAndEntity({ assistantId, fileId, userId }),
      },
      {
        functionName: 'getFileMappings',
        testFunction: () => getFileMappings({ assistantId, schoolId, userId }),
      },
      {
        functionName: 'updateAssistantAccessLevel',
        testFunction: () =>
          updateAssistantAccessLevel({ assistantId, accessLevel: 'school', userId }),
      },
      {
        functionName: 'updateAssistant',
        testFunction: () => updateAssistant({ assistantId, assistantProps: {}, userId }),
      },
      {
        functionName: 'deleteAssistant',
        testFunction: () => deleteAssistant({ assistantId, userId }),
      },
      {
        functionName: 'uploadAvatarPictureForAssistant',
        testFunction: () =>
          uploadAvatarPictureForAssistant({
            assistantId,
            userId: 'different-user-id',
            croppedImageBlob: new Blob(),
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
    const schoolId = generateUUID();

    const mockAssistant: Partial<AssistantSelectModel> = {
      userId,
      schoolId,
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
            userId: 'different-user-id',
            schoolId: 'school-id',
          }),
      },
      {
        functionName: 'linkFileToAssistant',
        testFunction: () =>
          linkFileToAssistant({
            assistantId,
            fileId,
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () =>
          deleteFileMappingAndEntity({
            assistantId,
            fileId,
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'updateAssistantAccessLevel',
        testFunction: () =>
          updateAssistantAccessLevel({
            assistantId,
            accessLevel: 'school',
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'updateAssistant',
        testFunction: () =>
          updateAssistant({
            assistantId,
            userId: 'different-user-id',
            assistantProps: {},
          }),
      },
      {
        functionName: 'deleteAssistant',
        testFunction: () =>
          deleteAssistant({
            assistantId,
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'uploadAvatarPictureForAssistant',
        testFunction: () =>
          uploadAvatarPictureForAssistant({
            assistantId,
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
    const userId = generateUUID();
    const assistantId = generateUUID();
    const schoolId = generateUUID();

    it.each([
      {
        functionName: 'getAssistantByUser',
        testFunction: () =>
          getAssistantByUser({
            assistantId,
            userId: 'different-user-id',
            schoolId: 'school-id',
          }),
      },
      {
        functionName: 'getAssistantForNewChat',
        testFunction: () =>
          getAssistantForNewChat({
            assistantId,
            userId: 'different-user-id',
            schoolId: 'school-id',
          }),
      },
    ])(
      'should throw ForbiddenError when user is not owner of private assistant - $functionName',
      async ({ testFunction }) => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId,
          schoolId,
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
            userId: 'different-user-id',
            schoolId: 'different-school-id',
          }),
      },
      {
        functionName: 'getAssistantForNewChat',
        testFunction: () =>
          getAssistantForNewChat({
            assistantId,
            userId: 'different-user-id',
            schoolId: 'different-school-id',
          }),
      },
    ])(
      'should throw ForbiddenError when user is not in same school - $functionName',
      async ({ testFunction }) => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId,
          schoolId,
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
          schoolId: 'school-id',
          userId: 'different-user-id',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when user has not same schoolId as assistant - getFileMappings', async () => {
      const userId = generateUUID();
      const assistantId = generateUUID();
      const mockAssistant: Partial<AssistantSelectModel> = {
        accessLevel: 'school',
        schoolId: 'school-1',
        userId,
      };

      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        mockAssistant as never,
      );

      await expect(
        getFileMappings({
          assistantId,
          schoolId: 'different-school-id',
          userId: 'different-user-id',
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
          userId: userId,
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('ForbiddenError scenarios - role restrictions', () => {
    it('should throw ForbiddenError when user is not a teacher - createNewAssistant', async () => {
      await expect(
        createNewAssistant({
          schoolId: 'school-id',
          user: mockUser('student'),
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('InvalidArgumentError scenarios - invalid parameter format', () => {
    it.each([
      {
        functionName: 'getAssistantByUser',
        testFunction: () =>
          getAssistantByUser({
            assistantId: 'invalid-uuid',
            userId: 'user-id',
            schoolId: 'school-id',
          }),
      },
      {
        functionName: 'getAssistantForNewChat',
        testFunction: () =>
          getAssistantForNewChat({
            assistantId: 'invalid-uuid',
            userId: 'user-id',
            schoolId: 'school-id',
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
            userId: 'user-id',
          }),
      },
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () =>
          deleteFileMappingAndEntity({
            assistantId: 'invalid-uuid',
            fileId: generateUUID(),
            userId: 'user-id',
          }),
      },
      {
        functionName: 'getFileMappings',
        testFunction: () =>
          getFileMappings({
            assistantId: 'invalid-uuid',
            userId: 'user-id',
            schoolId: 'school-id',
          }),
      },
      {
        functionName: 'updateAssistantAccessLevel',
        testFunction: () =>
          updateAssistantAccessLevel({
            assistantId: 'invalid-uuid',
            accessLevel: 'school',
            userId: 'user-id',
          }),
      },
      {
        functionName: 'deleteAssistant',
        testFunction: () =>
          deleteAssistant({
            assistantId: 'invalid-uuid',
            userId: 'user-id',
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
    const schoolIdOfOwner = generateUUID();
    const userIdOfOwner = generateUUID();

    describe.each([
      { accessLevel: 'private', schoolId: 'any', userId: userIdOfOwner },
      { accessLevel: 'school', schoolId: schoolIdOfOwner, userId: 'different-user-id' },
      { accessLevel: 'global', schoolId: 'different-school-id', userId: 'different-user-id' },
    ] as const)('accessLevel=$accessLevel', ({ accessLevel, schoolId, userId }) => {
      it(`should return assistant with accessLevel=${accessLevel} - getAssistantForNewChat`, async () => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: userIdOfOwner,
          schoolId: schoolIdOfOwner,
          accessLevel,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        const assistant = await getAssistantForNewChat({
          assistantId,
          schoolId,
          userId,
        });

        expect(assistant).toBe(mockAssistant);
      });
    });
  });

  describe('getAssistantByUser', () => {
    const assistantId = generateUUID();
    const schoolIdOfOwner = generateUUID();
    const userIdOfOwner = generateUUID();

    describe.each([
      { accessLevel: 'private', schoolId: 'any', userId: userIdOfOwner },
      { accessLevel: 'school', schoolId: schoolIdOfOwner, userId: 'different-user-id' },
      { accessLevel: 'global', schoolId: 'different-school-id', userId: 'different-user-id' },
    ] as const)('accessLevel=$accessLevel', ({ accessLevel, schoolId, userId }) => {
      it(`should return assistant with accessLevel=${accessLevel} - getAssistantByUser`, async () => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: userIdOfOwner,
          schoolId: schoolIdOfOwner,
          accessLevel,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        const { assistant } = await getAssistantByUser({
          assistantId,
          schoolId,
          userId,
        });

        expect(assistant).toBe(mockAssistant);
      });
    });
  });

  describe('Link sharing bypass scenarios', () => {
    const assistantId = generateUUID();
    const ownerUserId = generateUUID();
    const ownerSchoolId = generateUUID();
    const differentUserId = generateUUID();
    const differentSchoolId = generateUUID();

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
          schoolId: ownerSchoolId,
          accessLevel,
          hasLinkAccess: true,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        // User from different school trying to access - should succeed because hasLinkAccess is true
        const result = await getAssistantByUser({
          assistantId,
          userId: differentUserId,
          schoolId: differentSchoolId,
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
          schoolId: ownerSchoolId,
          accessLevel,
          hasLinkAccess: true,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        // User from different school trying to access - should succeed because hasLinkAccess is true
        const result = await getAssistantForNewChat({
          assistantId,
          userId: differentUserId,
          schoolId: differentSchoolId,
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
          schoolId: ownerSchoolId,
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
            userId: differentUserId,
            schoolId: differentSchoolId,
          }),
        ).resolves.not.toThrow();
      });
    });

    describe('should still enforce restrictions when hasLinkAccess is false', () => {
      it('getAssistantByUser - private assistant without link sharing', async () => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel: 'private',
          hasLinkAccess: false,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        await expect(
          getAssistantByUser({
            assistantId,
            userId: differentUserId,
            schoolId: differentSchoolId,
          }),
        ).rejects.toThrow(ForbiddenError);
      });

      it('getAssistantForNewChat - private assistant without link sharing', async () => {
        const mockAssistant: Partial<AssistantSelectModel> = {
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel: 'private',
          hasLinkAccess: false,
        };

        (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
          mockAssistant as never,
        );

        await expect(
          getAssistantForNewChat({
            assistantId,
            userId: differentUserId,
            schoolId: differentSchoolId,
          }),
        ).rejects.toThrow(ForbiddenError);
      });
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
        userId,
        croppedImageBlob: new Blob(['data'], { type: 'image/png' }),
      });

      expect(uploadFileToS3).toHaveBeenCalled();
      expect(mockDbUpdate).toHaveBeenCalled();
      expect(result).toEqual({
        picturePath: `custom-gpts/${assistantId}/avatar_3a6eb0790f39`,
        signedUrl: 'https://signed-url',
      });
    });
  });
});
