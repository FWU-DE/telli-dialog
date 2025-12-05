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

describe('learning-scenario-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotFoundError scenarios', () => {
    it.each([
      {
        functionName: 'getLearningScenario',
        testFunction: () =>
          getLearningScenario({ learningScenarioId: 'nonexistent-id', userId: 'user-id' }),
      },
      {
        functionName: 'deleteLearningScenario',
        testFunction: () =>
          deleteLearningScenario({ learningScenarioId: 'nonexistent-id', userId: 'user-id' }),
      },
      {
        functionName: 'linkFileToLearningScenario',
        testFunction: () =>
          linkFileToLearningScenario({
            fileId: 'file-id',
            learningScenarioId: 'nonexistent-id',
            userId: 'user-id',
          }),
      },
    ])(
      'should throw NotFoundError when learning scenario does not exist - $functionName',
      async ({ testFunction }) => {
        (
          dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
        ).mockResolvedValue(null as never);

        await expect(testFunction()).rejects.toThrowError(NotFoundError);
      },
    );
  });

  describe('ForbiddenError scenarios - user not owner', () => {
    const userId = generateUUID();
    const mockLearningScenario: Partial<SharedSchoolConversationModel> = {
      userId: userId,
      id: 'scenario-id',
      name: 'Test Scenario',
    };

    beforeEach(() => {
      (
        dbGetSharedSchoolChatById as MockedFunction<typeof dbGetSharedSchoolChatById>
      ).mockResolvedValue(mockLearningScenario as never);
    });

    it.each([
      {
        functionName: 'getLearningScenario',
        testFunction: () =>
          getLearningScenario({ learningScenarioId: 'scenario-id', userId: 'different-user-id' }),
      },
      {
        functionName: 'updateLearningScenario',
        testFunction: () =>
          updateLearningScenario({
            learningScenarioId: 'scenario-id',
            user: mockUser('teacher'),
            data: mockLearningScenario as SharedSchoolConversationModel,
          }),
      },
      {
        functionName: 'updateLearningScenarioPicture',
        testFunction: () =>
          updateLearningScenarioPicture({
            learningScenarioId: 'scenario-id',
            picturePath: '/path/to/picture',
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'shareLearningScenario',
        testFunction: () =>
          shareLearningScenario({
            learningScenarioId: 'scenario-id',
            data: { intelliPointsPercentageLimit: 50, usageTimeLimit: 60 },
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'unshareLearningScenario',
        testFunction: () =>
          unshareLearningScenario({
            learningScenarioId: 'scenario-id',
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'removeFileFromLearningScenario',
        testFunction: () =>
          removeFileFromLearningScenario({
            learningScenarioId: 'scenario-id',
            fileId: 'file-id',
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

  describe('ForbiddenError scenarios - role restrictions', () => {
    it('should throw ForbiddenError when user is not a teacher - createNewLearningScenario', async () => {
      await expect(
        createNewLearningScenario({
          data: { name: 'Test Scenario', description: 'Test Description', modelId: 'model-1' },
          user: mockUser('student'),
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });
});
