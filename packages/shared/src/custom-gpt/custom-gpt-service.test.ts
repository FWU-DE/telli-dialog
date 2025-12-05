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
import { CustomGptModel } from '@shared/db/schema';
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

    it.each([
      {
        functionName: 'getCustomGptForEditView',
        testFunction: () =>
          getCustomGptForEditView({
            customGptId,
            userId: 'user-id',
          }),
      },
      {
        functionName: 'getCustomGptForNewChat',
        testFunction: () =>
          getCustomGptForNewChat({
            customGptId,
            userId: 'user-id',
            schoolId: 'school-id',
          }),
      },
    ])(
      'should throw NotFoundError when custom GPT does not exist - $functionName',
      async ({ testFunction }) => {
        (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
          null as never,
        );

        await expect(testFunction()).rejects.toThrowError(NotFoundError);
      },
    );

    it('should throw NotFoundError when conversation not found - getConversationWithMessagesAndCustomGpt', async () => {
      const userId = generateUUID();
      const customGptId = generateUUID();
      const conversationId = generateUUID();

      const mockCustomGpt: Partial<CustomGptModel> = { userId };

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

    const mockCustomGpt: Partial<CustomGptModel> = { userId };

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
    it('should throw ForbiddenError when user is not owner of private custom GPT - getCustomGptForNewChat', async () => {
      const userId = generateUUID();
      const customGptId = generateUUID();

      const mockCustomGpt: Partial<CustomGptModel> = { userId, accessLevel: 'private' };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        getCustomGptForNewChat({
          customGptId,
          userId: 'different-user-id',
          schoolId: 'school-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

    it('should throw ForbiddenError when user is not in same school - getCustomGptForNewChat', async () => {
      const userId = generateUUID();
      const customGptId = generateUUID();
      const mockCustomGpt: Partial<CustomGptModel> = {
        userId,
        accessLevel: 'school',
        schoolId: 'school-1',
      };

      (dbGetCustomGptById as MockedFunction<typeof dbGetCustomGptById>).mockResolvedValue(
        mockCustomGpt as never,
      );

      await expect(
        getCustomGptForNewChat({
          customGptId,
          userId: 'different-user-id',
          schoolId: 'different-school-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });

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
      const mockCustomGpt: Partial<CustomGptModel> = { accessLevel: 'private', userId };

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
      const mockCustomGpt: Partial<CustomGptModel> = {
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
      const mockCustomGpt: Partial<CustomGptModel> = { userId };

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
        functionName: 'linkFileToCustomGpt (invalid fileId)',
        testFunction: () =>
          linkFileToCustomGpt({
            customGptId: generateUUID(),
            fileId: 'invalid-uuid',
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
        functionName: 'deleteFileMappingAndEntity (invalid fileId)',
        testFunction: () =>
          deleteFileMappingAndEntity({
            customGptId: generateUUID(),
            fileId: 'invalid-uuid',
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
});
