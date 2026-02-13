import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import {
  createNewLearningScenario,
  deleteLearningScenario,
  getFilesForLearningScenario,
  getLearningScenarioForEditView,
  getSharedLearningScenario,
  linkFileToLearningScenario,
  removeFileFromLearningScenario,
  shareLearningScenario,
  unshareLearningScenario,
  updateLearningScenario,
  updateLearningScenarioAccessLevel,
  updateLearningScenarioPicture,
} from './learning-scenario-service';
import {
  dbGetLearningScenarioById,
  dbGetLearningScenarioByIdOptionalShareData,
  dbGetLearningScenarioByIdWithShareData,
  dbGetSharedLearningScenarioConversations,
} from '../db/functions/learning-scenario';
import { dbGetFilesForLearningScenario } from '../db/functions/files';
import { getAvatarPictureUrl } from '../files/fileService';
import { generateUUID } from '../utils/uuid';
import { LearningScenarioSelectModel } from '@shared/db/schema';
import { ForbiddenError, InvalidArgumentError, NotFoundError } from '@shared/error';
import { UserModel } from '@shared/auth/user-model';

vi.mock('../db/functions/learning-scenario', () => ({
  dbGetLearningScenarioById: vi.fn(),
  dbGetLearningScenarioByIdOptionalShareData: vi.fn(),
  dbGetLearningScenarioByIdWithShareData: vi.fn(),
  dbGetSharedLearningScenarioConversations: vi.fn(),
}));
vi.mock('../db/functions/files', () => ({
  dbGetFilesForLearningScenario: vi.fn(),
}));
vi.mock('../files/fileService', () => ({
  getAvatarPictureUrl: vi.fn(),
}));

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
    const learningScenarioId = generateUUID();
    const fileId = generateUUID();
    const schoolId = generateUUID();
    const userId = generateUUID();

    it.each([
      {
        functionName: 'getLearningScenarioForEditView',
        testFunction: () =>
          getLearningScenarioForEditView({ learningScenarioId, schoolId, userId }),
      },
      {
        functionName: 'deleteLearningScenario',
        testFunction: () =>
          deleteLearningScenario({
            learningScenarioId,
            userId,
          }),
      },
      {
        functionName: 'linkFileToLearningScenario',
        testFunction: () =>
          linkFileToLearningScenario({
            fileId,
            learningScenarioId,
            userId,
          }),
      },
      {
        functionName: 'getSharedLearningScenario',
        testFunction: () =>
          getSharedLearningScenario({
            learningScenarioId,
            userId,
          }),
      },
      {
        functionName: 'updateLearningScenarioAccessLevel',
        testFunction: () =>
          updateLearningScenarioAccessLevel({
            accessLevel: 'private',
            learningScenarioId,
            userId,
          }),
      },
    ])(
      'should throw NotFoundError when learning scenario does not exist - $functionName',
      async ({ testFunction }) => {
        (
          dbGetLearningScenarioById as MockedFunction<typeof dbGetLearningScenarioById>
        ).mockResolvedValue(null as never);

        await expect(testFunction()).rejects.toThrowError(NotFoundError);
      },
    );
  });

  describe('ForbiddenError scenarios - user not owner', () => {
    const userId = generateUUID();
    const learningScenarioId = generateUUID();
    const fileId = generateUUID();
    const schoolId = generateUUID();
    const mockLearningScenario: Partial<LearningScenarioSelectModel> = {
      userId,
      id: learningScenarioId,
      name: 'Test Scenario',
      accessLevel: 'private',
    };

    beforeEach(() => {
      (
        dbGetLearningScenarioById as MockedFunction<typeof dbGetLearningScenarioById>
      ).mockResolvedValue(mockLearningScenario as never);
      (
        dbGetLearningScenarioByIdOptionalShareData as MockedFunction<
          typeof dbGetLearningScenarioByIdOptionalShareData
        >
      ).mockResolvedValue(mockLearningScenario as never);
      (
        dbGetLearningScenarioByIdWithShareData as MockedFunction<
          typeof dbGetLearningScenarioByIdWithShareData
        >
      ).mockResolvedValue(mockLearningScenario as never);
      (
        dbGetSharedLearningScenarioConversations as MockedFunction<
          typeof dbGetSharedLearningScenarioConversations
        >
      ).mockResolvedValue([] as never);
    });

    it.each([
      {
        functionName: 'getLearningScenarioForEditView',
        testFunction: () =>
          getLearningScenarioForEditView({
            learningScenarioId,
            schoolId,
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'updateLearningScenario',
        testFunction: () =>
          updateLearningScenario({
            learningScenarioId,
            user: mockUser('teacher'),
            data: mockLearningScenario as LearningScenarioSelectModel,
          }),
      },
      {
        functionName: 'updateLearningScenarioPicture',
        testFunction: () =>
          updateLearningScenarioPicture({
            learningScenarioId,
            picturePath: '/path/to/picture',
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'shareLearningScenario',
        testFunction: () =>
          shareLearningScenario({
            learningScenarioId,
            data: { telliPointsPercentageLimit: 50, usageTimeLimit: 60 },
            user: mockUser('teacher'),
          }),
      },
      {
        functionName: 'unshareLearningScenario',
        testFunction: () =>
          unshareLearningScenario({
            learningScenarioId,
            user: mockUser('teacher'),
          }),
      },
      {
        functionName: 'removeFileFromLearningScenario',
        testFunction: () =>
          removeFileFromLearningScenario({
            learningScenarioId,
            fileId: fileId,
            userId: 'different-user-id',
          }),
      },
      {
        functionName: 'updateLearningScenarioAccessLevel',
        testFunction: () =>
          updateLearningScenarioAccessLevel({
            accessLevel: 'private',
            learningScenarioId,
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
    it.each([
      {
        functionName: createNewLearningScenario,
        testFunction: () =>
          createNewLearningScenario({
            modelId: 'model-1',
            user: mockUser('student'),
            schoolId: generateUUID(),
          }),
      },
      {
        functionName: shareLearningScenario,
        testFunction: () =>
          shareLearningScenario({
            learningScenarioId: generateUUID(),
            data: { telliPointsPercentageLimit: 50, usageTimeLimit: 60 },
            user: mockUser('student'),
          }),
      },
      {
        functionName: unshareLearningScenario,
        testFunction: () =>
          unshareLearningScenario({
            learningScenarioId: generateUUID(),
            user: mockUser('student'),
          }),
      },
    ])(
      'should throw ForbiddenError when user is not a teacher - $functionName',
      async ({ testFunction }) => {
        await expect(testFunction()).rejects.toThrowError(ForbiddenError);
      },
    );
  });

  describe('ForbiddenError scenarios - access restrictions', () => {
    const userId = generateUUID();
    const learningScenarioId = generateUUID();
    const mockLearningScenario: Partial<LearningScenarioSelectModel> = {
      userId,
      id: learningScenarioId,
      name: 'Test Scenario',
      accessLevel: 'private',
    };

    beforeEach(() => {
      (
        dbGetLearningScenarioById as MockedFunction<typeof dbGetLearningScenarioById>
      ).mockResolvedValue(mockLearningScenario as never);
    });

    it('should throw ForbiddenError when setting access level to global - updateLearningScenarioAccessLevel', async () => {
      await expect(
        updateLearningScenarioAccessLevel({
          learningScenarioId: generateUUID(),
          userId: userId,
          accessLevel: 'global',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('InvalidArgumentError scenarios - invalid parameter format', () => {
    const schoolId = generateUUID();

    it.each([
      {
        functionName: 'getLearningScenarioForEditView',
        testFunction: () =>
          getLearningScenarioForEditView({
            learningScenarioId: 'invalid-uuid',
            schoolId,
            userId: 'user-id',
          }),
      },
      {
        functionName: 'updateLearningScenario',
        testFunction: () =>
          updateLearningScenario({
            learningScenarioId: 'invalid-uuid',
            user: mockUser('teacher'),
            data: { name: 'Test', description: 'Test' } as LearningScenarioSelectModel,
          }),
      },
      {
        functionName: 'updateLearningScenarioPicture',
        testFunction: () =>
          updateLearningScenarioPicture({
            learningScenarioId: 'invalid-uuid',
            picturePath: '/path/to/picture',
            userId: 'user-id',
          }),
      },
      {
        functionName: 'shareLearningScenario',
        testFunction: () =>
          shareLearningScenario({
            learningScenarioId: 'invalid-uuid',
            data: { telliPointsPercentageLimit: 50, usageTimeLimit: 60 },
            user: mockUser('teacher'),
          }),
      },
      {
        functionName: 'unshareLearningScenario',
        testFunction: () =>
          unshareLearningScenario({
            learningScenarioId: 'invalid-uuid',
            user: mockUser('teacher'),
          }),
      },
      {
        functionName: 'deleteLearningScenario',
        testFunction: () =>
          deleteLearningScenario({
            learningScenarioId: 'invalid-uuid',
            userId: 'user-id',
          }),
      },
      {
        functionName: 'linkFileToLearningScenario',
        testFunction: () =>
          linkFileToLearningScenario({
            learningScenarioId: 'invalid-uuid',
            fileId: generateUUID(),
            userId: 'user-id',
          }),
      },
      {
        functionName: 'removeFileFromLearningScenario',
        testFunction: () =>
          removeFileFromLearningScenario({
            learningScenarioId: 'invalid-uuid',
            fileId: generateUUID(),
            userId: 'user-id',
          }),
      },
      {
        functionName: 'getSharedLearningScenario',
        testFunction: () =>
          getSharedLearningScenario({
            learningScenarioId: 'invalid-uuid',
            userId: 'user-id',
          }),
      },
      {
        functionName: 'updateLearningScenarioAccessLevel',
        testFunction: () =>
          updateLearningScenarioAccessLevel({
            accessLevel: 'private',
            learningScenarioId: 'invalid-uuid',
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

  describe('Link sharing bypass scenarios', () => {
    const learningScenarioId = generateUUID();
    const ownerUserId = generateUUID();
    const ownerSchoolId = generateUUID();
    const differentUserId = generateUUID();
    const differentSchoolId = generateUUID();

    describe('should allow access when hasLinkAccess is true - bypassing normal restrictions', () => {
      it.each([
        {
          accessLevel: 'private' as const,
          description: 'private learning scenario with link sharing enabled',
        },
        {
          accessLevel: 'school' as const,
          description: 'school learning scenario with link sharing enabled (different school)',
        },
      ])('getLearningScenarioForEditView - $description', async ({ accessLevel }) => {
        const mockLearningScenario = {
          id: learningScenarioId,
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel,
          hasLinkAccess: true,
        };

        (
          dbGetLearningScenarioByIdOptionalShareData as MockedFunction<
            typeof dbGetLearningScenarioByIdOptionalShareData
          >
        ).mockResolvedValue(mockLearningScenario as never);
        // Also mock dbGetLearningScenarioById because getFilesForLearningScenario -> getLearningScenarioInfo uses it
        (
          dbGetLearningScenarioById as MockedFunction<typeof dbGetLearningScenarioById>
        ).mockResolvedValue(mockLearningScenario as never);
        (
          dbGetFilesForLearningScenario as MockedFunction<typeof dbGetFilesForLearningScenario>
        ).mockResolvedValue([]);
        (getAvatarPictureUrl as MockedFunction<typeof getAvatarPictureUrl>).mockResolvedValue(
          undefined,
        );

        // User from different school trying to access - should succeed because hasLinkAccess is true
        const result = await getLearningScenarioForEditView({
          learningScenarioId,
          userId: differentUserId,
          schoolId: differentSchoolId,
        });

        expect(result.learningScenario).toBe(mockLearningScenario);
      });

      it.each([
        {
          accessLevel: 'private' as const,
          description: 'private learning scenario with link sharing enabled',
        },
        {
          accessLevel: 'school' as const,
          description: 'school learning scenario with link sharing enabled (different school)',
        },
      ])('getFilesForLearningScenario - $description', async ({ accessLevel }) => {
        const mockLearningScenario: Partial<LearningScenarioSelectModel> = {
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel,
          hasLinkAccess: true,
        };

        (
          dbGetLearningScenarioById as MockedFunction<typeof dbGetLearningScenarioById>
        ).mockResolvedValue(mockLearningScenario as never);
        (
          dbGetFilesForLearningScenario as MockedFunction<typeof dbGetFilesForLearningScenario>
        ).mockResolvedValue([]);

        // Should not throw - access is allowed via link sharing
        await expect(
          getFilesForLearningScenario({
            learningScenarioId,
            userId: differentUserId,
            schoolId: differentSchoolId,
          }),
        ).resolves.not.toThrow();
      });
    });

    describe('should still enforce restrictions when hasLinkAccess is false', () => {
      it('getLearningScenarioForEditView - private learning scenario without link sharing', async () => {
        const mockLearningScenario = {
          id: learningScenarioId,
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel: 'private' as const,
          hasLinkAccess: false,
        };

        (
          dbGetLearningScenarioByIdOptionalShareData as MockedFunction<
            typeof dbGetLearningScenarioByIdOptionalShareData
          >
        ).mockResolvedValue(mockLearningScenario as never);

        await expect(
          getLearningScenarioForEditView({
            learningScenarioId,
            userId: differentUserId,
            schoolId: differentSchoolId,
          }),
        ).rejects.toThrowError(ForbiddenError);
      });

      it('getFilesForLearningScenario - private learning scenario without link sharing', async () => {
        const mockLearningScenario: Partial<LearningScenarioSelectModel> = {
          userId: ownerUserId,
          schoolId: ownerSchoolId,
          accessLevel: 'private',
          hasLinkAccess: false,
        };

        (
          dbGetLearningScenarioById as MockedFunction<typeof dbGetLearningScenarioById>
        ).mockResolvedValue(mockLearningScenario as never);

        await expect(
          getFilesForLearningScenario({
            learningScenarioId,
            userId: differentUserId,
            schoolId: differentSchoolId,
          }),
        ).rejects.toThrowError(ForbiddenError);
      });
    });
  });
});
