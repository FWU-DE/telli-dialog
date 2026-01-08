import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import {
  createNewCustomGpt,
  deleteCustomGpt,
  deleteFileMappingAndEntity,
  getConversationWithMessagesAndCustomGpt,
  getCustomGptForEditView,
  getCustomGptForNewChat,
  getFileMappings,
  linkFileToCustomGpt,
  updateCustomGpt,
  updateCustomGptAccessLevel,
  updateCustomGptPicture,
} from './custom-gpt-service';
import { ForbiddenError, NotFoundError, InvalidArgumentError } from '@shared/error';
import { generateUUID } from '@shared/utils/uuid';
import { dbGetCustomGptById } from '@shared/db/functions/custom-gpts';
import { CustomGptSelectModel } from '@shared/db/schema';
import { UserModel } from '@shared/auth/user-model';
import {
  getConversation,
  getConversationMessages,
} from '@shared/conversation/conversation-service';

vi.mock('../db/functions/custom-gpts', () => ({
  dbGetCustomGptById: vi.fn(),
}));
vi.mock('../conversation/conversation-service', () => ({
  getConversation: vi.fn(),
  getConversationMessages: vi.fn(),
}));

const mockUser = (userRole: 'student' | 'teacher' = 'teacher'): UserModel => ({
  id: generateUUID(),
  lastUsedModel: null,
  versionAcceptedConditions: null,
  createdAt: new Date(),
  userRole,
});

describe('custom-gpt-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotFoundError scenarios', () => {
    const customGptId = generateUUID();
    const schoolId = generateUUID();
    const userId = generateUUID();
    const fileId = generateUUID();

    it.each([
      {
        functionName: 'getCustomGptForEditView',
        testFunction: () => getCustomGptForEditView({ customGptId, schoolId, userId }),
      },
      {
        functionName: 'getCustomGptForNewChat',
        testFunction: () => getCustomGptForNewChat({ customGptId, schoolId, userId }),
      },
      {
        functionName: 'linkFileToCustomGpt',
        testFunction: () => linkFileToCustomGpt({ customGptId, fileId, userId }),
      },
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () => deleteFileMappingAndEntity({ customGptId, fileId, userId }),
      },
      {
        functionName: 'getFileMappings',
        testFunction: () => getFileMappings({ customGptId, schoolId, userId }),
      },
      {
        functionName: 'updateCustomGptAccessLevel',
        testFunction: () =>
          updateCustomGptAccessLevel({ customGptId, accessLevel: 'school', userId }),
      },
      {
        functionName: 'updateCustomGptPicture',
        testFunction: () => updateCustomGptPicture({ customGptId, picturePath: fileId, userId }),
      },
      {
        functionName: 'updateCustomGpt',
        testFunction: () => updateCustomGpt({ customGptId, customGptProps: {}, userId }),
      },
      {
        functionName: 'deleteCustomGpt',
        testFunction: () => deleteCustomGpt({ customGptId, userId }),
      },
    ])(
      'should throw NotFoundError from dbGetCustomGptById when custom GPT does not exist - $functionName',
      async ({ testFunction }) => {
        (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockRejectedValue(
          new NotFoundError(),
        );

        await expect(testFunction()).rejects.toThrowError(NotFoundError);
      },
    );

    it('should throw NotFoundError when conversation not found - getConversationWithMessagesAndCustomGpt', async () => {
      const userId = generateUUID();
      const customGptId = generateUUID();
      const conversationId = generateUUID();

      const mockCustomGpt: Partial<CustomGptSelectModel> = { userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );
      (getConversation as MockedFunction<typeof getConversation>).mockRejectedValue(
        new NotFoundError('Conversation not found'),
      );
      (getConversationMessages as MockedFunction<typeof getConversationMessages>).mockResolvedValue(
        null as never,
      );

      await expect(
        getConversationWithMessagesAndCustomGpt({
          conversationId,
          customGptId,
          userId,
        }),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when custom GPT not found - getConversationWithMessagesAndCustomGpt', async () => {
      const userId = generateUUID();
      const customGptId = generateUUID();
      const conversationId = generateUUID();

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockRejectedValue(
        new NotFoundError('Custom Gpt not found'),
      );
      (getConversation as MockedFunction<typeof getConversation>).mockResolvedValue(null as never);
      (getConversationMessages as MockedFunction<typeof getConversationMessages>).mockResolvedValue(
        null as never,
      );

      await expect(
        getConversationWithMessagesAndCustomGpt({
          conversationId,
          customGptId,
          userId,
        }),
      ).rejects.toThrowError(NotFoundError);
    });
  });

  describe('ForbiddenError scenarios - user not owner', () => {
    const userId = generateUUID();
    const customGptId = generateUUID();
    const fileId = generateUUID();
    const schoolId = generateUUID();

    const mockCustomGpt: Partial<CustomGptSelectModel> = {
      userId,
      schoolId,
      accessLevel: 'private',
    };

    beforeEach(() => {
      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );
    });

    it.each([
      {
        functionName: 'getCustomGptForEditView',
        testFunction: () =>
          getCustomGptForEditView({
            customGptId,
            userId: 'different-user-id',
            schoolId: 'school-id',
          }),
      },
      {
        functionName: 'linkFileToCustomGpt',
        testFunction: () =>
          linkFileToCustomGpt({
            customGptId,
            fileId,
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () =>
          deleteFileMappingAndEntity({
            customGptId,
            fileId,
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'updateCustomGptAccessLevel',
        testFunction: () =>
          updateCustomGptAccessLevel({
            customGptId,
            accessLevel: 'school',
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'updateCustomGptPicture',
        testFunction: () =>
          updateCustomGptPicture({
            customGptId,
            picturePath: 'picture-path',
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'updateCustomGpt',
        testFunction: () =>
          updateCustomGpt({
            customGptId,
            userId: 'different-user-id',
            customGptProps: {},
          }),
      },
      {
        functionName: 'deleteCustomGpt',
        testFunction: () =>
          deleteCustomGpt({
            customGptId,
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
    const userId = generateUUID();
    const customGptId = generateUUID();
    const schoolId = generateUUID();

    it.each([
      {
        functionName: 'getCustomGptForEditView',
        testFunction: () =>
          getCustomGptForEditView({
            customGptId,
            userId: 'different-user-id',
            schoolId: 'school-id',
          }),
      },
      {
        functionName: 'getCustomGptForNewChat',
        testFunction: () =>
          getCustomGptForNewChat({
            customGptId,
            userId: 'different-user-id',
            schoolId: 'school-id',
          }),
      },
    ])(
      'should throw ForbiddenError when user is not owner of private custom GPT - $functionName',
      async ({ testFunction }) => {
        const mockCustomGpt: Partial<CustomGptSelectModel> = {
          userId,
          schoolId,
          accessLevel: 'private',
        };

        (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
          mockCustomGpt as never,
        );

        await expect(testFunction()).rejects.toThrowError(ForbiddenError);
      },
    );

    it.each([
      {
        functionName: 'getCustomGptForEditView',
        testFunction: () =>
          getCustomGptForEditView({
            customGptId,
            userId: 'different-user-id',
            schoolId: 'different-school-id',
          }),
      },
      {
        functionName: 'getCustomGptForNewChat',
        testFunction: () =>
          getCustomGptForNewChat({
            customGptId,
            userId: 'different-user-id',
            schoolId: 'different-school-id',
          }),
      },
    ])(
      'should throw ForbiddenError when user is not in same school - $functionName',
      async ({ testFunction }) => {
        const mockCustomGpt: Partial<CustomGptSelectModel> = {
          userId,
          schoolId,
          accessLevel: 'school',
        };

        (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
          mockCustomGpt as never,
        );

        await expect(testFunction()).rejects.toThrowError(ForbiddenError);
      },
    );

    it('should throw ForbiddenError when user is not owner of conversation - getConversationWithMessagesAndCustomGpt', async () => {
      const userId = generateUUID();
      const customGptId = generateUUID();
      const conversationId = generateUUID();

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        null as never,
      );
      (getConversation as MockedFunction<typeof getConversation>).mockRejectedValue(
        new ForbiddenError('Not authorized to access conversation'),
      );
      (getConversationMessages as MockedFunction<typeof getConversationMessages>).mockResolvedValue(
        null as never,
      );

      await expect(
        getConversationWithMessagesAndCustomGpt({
          conversationId,
          customGptId,
          userId,
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw ForbiddenError when user is not owner of private custom GPT - getFileMappings', async () => {
      const userId = generateUUID();
      const customGptId = generateUUID();
      const mockCustomGpt: Partial<CustomGptSelectModel> = { accessLevel: 'private', userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        getFileMappings({
          customGptId,
          schoolId: 'school-id',
          userId: 'different-user-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw ForbiddenError when user has not same schoolId as custom GPT - getFileMappings', async () => {
      const userId = generateUUID();
      const customGptId = generateUUID();
      const mockCustomGpt: Partial<CustomGptSelectModel> = {
        accessLevel: 'school',
        schoolId: 'school-1',
        userId,
      };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        getFileMappings({
          customGptId,
          schoolId: 'different-school-id',
          userId: 'different-user-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw ForbiddenError when setting access level to global not possible - updateCustomGptAccessLevel', async () => {
      const userId = generateUUID();
      const customGptId = generateUUID();
      const mockCustomGpt: Partial<CustomGptSelectModel> = { userId };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        updateCustomGptAccessLevel({
          customGptId,
          accessLevel: 'global',
          userId: userId,
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('ForbiddenError scenarios - role restrictions', () => {
    it('should throw ForbiddenError when user is not a teacher - createNewCustomGpt', async () => {
      await expect(
        createNewCustomGpt({
          schoolId: 'school-id',
          user: mockUser('student'),
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('InvalidArgumentError scenarios - invalid parameter format', () => {
    it.each([
      {
        functionName: 'getCustomGptForEditView',
        testFunction: () =>
          getCustomGptForEditView({
            customGptId: 'invalid-uuid',
            userId: 'user-id',
            schoolId: 'school-id',
          }),
      },
      {
        functionName: 'getCustomGptForNewChat',
        testFunction: () =>
          getCustomGptForNewChat({
            customGptId: 'invalid-uuid',
            userId: 'user-id',
            schoolId: 'school-id',
          }),
      },
      {
        functionName: 'getConversationWithMessagesAndCustomGpt',
        testFunction: () =>
          getConversationWithMessagesAndCustomGpt({
            customGptId: 'invalid-uuid',
            conversationId: generateUUID(),
            userId: 'user-id',
          }),
      },
      {
        functionName: 'getConversationWithMessagesAndCustomGpt (invalid conversationId)',
        testFunction: () =>
          getConversationWithMessagesAndCustomGpt({
            customGptId: generateUUID(),
            conversationId: 'invalid-uuid',
            userId: 'user-id',
          }),
      },
      {
        functionName: 'linkFileToCustomGpt',
        testFunction: () =>
          linkFileToCustomGpt({
            customGptId: 'invalid-uuid',
            fileId: generateUUID(),
            userId: 'user-id',
          }),
      },
      {
        functionName: 'deleteFileMappingAndEntity',
        testFunction: () =>
          deleteFileMappingAndEntity({
            customGptId: 'invalid-uuid',
            fileId: generateUUID(),
            userId: 'user-id',
          }),
      },
      {
        functionName: 'getFileMappings',
        testFunction: () =>
          getFileMappings({
            customGptId: 'invalid-uuid',
            userId: 'user-id',
            schoolId: 'school-id',
          }),
      },
      {
        functionName: 'updateCustomGptAccessLevel',
        testFunction: () =>
          updateCustomGptAccessLevel({
            customGptId: 'invalid-uuid',
            accessLevel: 'school',
            userId: 'user-id',
          }),
      },
      {
        functionName: 'updateCustomGptPicture',
        testFunction: () =>
          updateCustomGptPicture({
            customGptId: 'invalid-uuid',
            picturePath: 'picture-path',
            userId: 'user-id',
          }),
      },
      {
        functionName: 'deleteCustomGpt',
        testFunction: () =>
          deleteCustomGpt({
            customGptId: 'invalid-uuid',
            userId: 'user-id',
          }),
      },
    ])(
      'should throw InvalidArgumentError when parameter is not a valid UUID - $functionName',
      async ({ testFunction }) => {
        await expect(testFunction()).rejects.toThrowError(InvalidArgumentError);
      },
    );
  });

  describe('Allow access', () => {
    const customGptId = generateUUID();
    const schoolIdOfOwner = generateUUID();
    const userIdOfOwner = generateUUID();

    describe.each([
      { accessLevel: 'private', schoolId: 'any', userId: userIdOfOwner },
      { accessLevel: 'school', schoolId: schoolIdOfOwner, userId: 'different-user-id' },
      { accessLevel: 'global', schoolId: 'different-school-id', userId: 'different-user-id' },
    ] as const)('accessLevel=$accessLevel', ({ accessLevel, schoolId, userId }) => {
      it.each([
        {
          functionName: 'getCustomGptForEditView',
          testFunction: () =>
            getCustomGptForEditView({
              customGptId,
              schoolId,
              userId,
            }),
        },
        {
          functionName: 'getCustomGptForNewChat',
          testFunction: () =>
            getCustomGptForNewChat({
              customGptId,
              schoolId,
              userId,
            }),
        },
      ])(
        `should return customGpt with accessLevel=${accessLevel} - $functionName`,
        async ({ testFunction }) => {
          const mockCustomGpt: Partial<CustomGptSelectModel> = {
            userId: userIdOfOwner,
            schoolId: schoolIdOfOwner,
            accessLevel,
          };

          (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
            mockCustomGpt as never,
          );

          const customGpt = await testFunction();

          expect(customGpt).toBe(mockCustomGpt);
        },
      );
    });
  });
});
