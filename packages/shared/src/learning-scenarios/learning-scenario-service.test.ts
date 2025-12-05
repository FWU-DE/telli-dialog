import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';

vi.mock('../db/functions/shared-school-chat', () => ({
  dbGetSharedSchoolChatById: vi.fn(),
}));

import {
  getLearningScenario,
  updateLearningScenario,
  updateLearningScenarioPicture,
  shareLearningScenario,
  unshareLearningScenario,
  createNewLearningScenario,
  deleteLearningScenario,
  linkFileToLearningScenario,
  removeFileFromLearningScenario,
} from './learning-scenario-service';
import { dbGetSharedSchoolChatById } from '../db/functions/shared-school-chat';
import { generateUUID } from '../utils/uuid';
import { SharedSchoolConversationModel } from '@shared/db/schema';
import { ForbiddenError, NotFoundError } from '@shared/error';
import { UserModel } from '@shared/auth/user-model';

const mockUser = (userRole: 'student' | 'teacher' = 'teacher'): UserModel => ({
  id: generateUUID(),
  lastUsedModel: null,
  versionAcceptedConditions: null,
  createdAt: new Date(),
  userRole,
});

describe('Learning Scenario Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLearningScenario', () => {
    it('should throw NotFoundError when learning scenario does not exist', async () => {
      (
        dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
      ).mockResolvedValue(null as never);

      await expect(
        getLearningScenario({
          learningScenarioId: 'nonexistent-id',
          userId: 'user-id',
        }),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should throw ForbiddenError when user is not the owner of the learning scenario', async () => {
      const userId = generateUUID();
      const mockLearningScenario: Partial<SharedSchoolConversationModel> = {
        userId: userId,
        id: 'scenario-id',
        name: 'Test Scenario',
      };

      (
        dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
      ).mockResolvedValue(mockLearningScenario as never);

      await expect(
        getLearningScenario({
          learningScenarioId: 'scenario-id',
          userId: 'different-user-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('updateLearningScenario', () => {
    it('should throw ForbiddenError when user is not the owner of the learning scenario', async () => {
      const userId = generateUUID();
      const mockLearningScenario: Partial<SharedSchoolConversationModel> = {
        userId: userId,
        id: 'scenario-id',
        name: 'Test Scenario',
      };

      (
        dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
      ).mockResolvedValue(mockLearningScenario as never);

      await expect(
        updateLearningScenario({
          learningScenarioId: 'scenario-id',
          user: mockUser('teacher'),
          data: mockLearningScenario as SharedSchoolConversationModel,
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('updateLearningScenarioPicture', () => {
    it('should throw ForbiddenError when user is not the owner of the learning scenario', async () => {
      const userId = generateUUID();
      const mockLearningScenario: Partial<SharedSchoolConversationModel> = {
        userId: userId,
        id: 'scenario-id',
        name: 'Test Scenario',
      };

      (
        dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
      ).mockResolvedValue(mockLearningScenario as never);

      await expect(
        updateLearningScenarioPicture({
          id: 'scenario-id',
          picturePath: '/path/to/picture',
          userId: 'different-user-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('shareLearningScenario', () => {
    it('should throw ForbiddenError when user is not the owner of the learning scenario', async () => {
      const userId = generateUUID();
      const mockLearningScenario: Partial<SharedSchoolConversationModel> = {
        userId: userId,
        id: 'scenario-id',
        name: 'Test Scenario',
      };

      (
        dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
      ).mockResolvedValue(mockLearningScenario as never);

      await expect(
        shareLearningScenario({
          learningScenarioId: 'scenario-id',
          data: { intelliPointsPercentageLimit: 50, usageTimeLimit: 60 },
          userId: 'different-user-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('unshareLearningScenario', () => {
    it('should throw ForbiddenError when user is not the owner of the learning scenario', async () => {
      const userId = generateUUID();
      const mockLearningScenario: Partial<SharedSchoolConversationModel> = {
        userId: userId,
        id: 'scenario-id',
        name: 'Test Scenario',
      };

      (
        dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
      ).mockResolvedValue(mockLearningScenario as never);

      await expect(
        unshareLearningScenario({
          learningScenarioId: 'scenario-id',
          userId: 'different-user-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('createNewLearningScenario', () => {
    it('should throw ForbiddenError when user is not a teacher', async () => {
      await expect(
        createNewLearningScenario({
          data: { name: 'Test Scenario', description: 'Test Description', modelId: 'model-1' },
          user: mockUser('student'),
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('deleteLearningScenario', () => {
    it('should throw NotFoundError when learning scenario does not exist', async () => {
      (
        dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
      ).mockResolvedValue(null as never);

      await expect(
        deleteLearningScenario({
          learningScenarioId: 'nonexistent-id',
          userId: 'user-id',
        }),
      ).rejects.toThrowError(NotFoundError);
    });
  });

  describe('linkFileToLearningScenario', () => {
    it('should throw NotFoundError when learning scenario does not exist', async () => {
      (
        dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
      ).mockResolvedValue(null as never);

      await expect(
        linkFileToLearningScenario({
          fileId: 'file-id',
          learningScenarioId: 'nonexistent-id',
          userId: 'user-id',
        }),
      ).rejects.toThrowError(NotFoundError);
    });
  });

  describe('removeFileFromLearningScenario', () => {
    it('should throw ForbiddenError when user is not the owner of the learning scenario', async () => {
      const userId = generateUUID();
      const mockLearningScenario: Partial<SharedSchoolConversationModel> = {
        userId: userId,
        id: 'scenario-id',
        name: 'Test Scenario',
      };

      (
        dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
      ).mockResolvedValue(mockLearningScenario as never);

      await expect(
        removeFileFromLearningScenario({
          learningScenarioId: 'scenario-id',
          fileId: 'file-id',
          userId: 'different-user-id',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });
});
