import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import {
  createNewLearningScenarioFromTemplate,
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
  uploadAvatarPictureForLearningScenario,
} from './learning-scenario-service';
import {
  dbCreateLearningScenarioShare,
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
  dbCreateLearningScenarioShare: vi.fn(),
  dbGetLearningScenarioById: vi.fn(),
  dbGetLearningScenarioByIdOptionalShareData: vi.fn(),
  dbGetLearningScenarioByIdWithShareData: vi.fn(),
  dbGetSharedLearningScenarioConversations: vi.fn(),
}));
vi.mock('./learning-scenario-admin-service', () => ({
  duplicateLearningScenario: vi.fn(),
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

function buildFunctionList(
  {
    learningScenarioId,
    schoolId,
    user,
  }: {
    learningScenarioId?: string;
    schoolId?: string;
    user?: UserModel;
  },
  ...modes: ('read' | 'write' | 'unshare' | 'read-by-invite-code')[]
) {
  const fileId = generateUUID();
  learningScenarioId ??= generateUUID();
  schoolId ??= generateUUID();
  user ??= mockUser();

  const writeAccess = [
    {
      functionName: deleteLearningScenario.name,
      testFunction: () =>
        deleteLearningScenario({
          learningScenarioId,
          user,
        }),
    },
    {
      functionName: linkFileToLearningScenario.name,
      testFunction: () =>
        linkFileToLearningScenario({
          fileId,
          learningScenarioId,
          user,
        }),
    },
    {
      functionName: updateLearningScenarioAccessLevel.name,
      testFunction: () =>
        updateLearningScenarioAccessLevel({
          accessLevel: 'private',
          learningScenarioId,
          user,
        }),
    },
    {
      functionName: uploadAvatarPictureForLearningScenario.name,
      testFunction: () =>
        uploadAvatarPictureForLearningScenario({
          learningScenarioId,
          croppedImageBlob: new Blob(),
          user,
        }),
    },
    {
      functionName: updateLearningScenario.name,
      testFunction: () =>
        updateLearningScenario({
          data: {} as LearningScenarioSelectModel,
          learningScenarioId,
          user,
        }),
    },
    {
      functionName: updateLearningScenarioPicture.name,
      testFunction: () =>
        updateLearningScenarioPicture({
          picturePath: 'path',
          learningScenarioId,
          user,
        }),
    },
    {
      functionName: removeFileFromLearningScenario.name,
      testFunction: () =>
        removeFileFromLearningScenario({
          fileId,
          learningScenarioId,
          user,
        }),
    },
  ];
  const readAccess = [
    {
      functionName: getLearningScenarioForEditView.name,
      testFunction: () =>
        getLearningScenarioForEditView({
          learningScenarioId,
          schoolId,
          user,
        }),
    },
    {
      functionName: createNewLearningScenarioFromTemplate.name,
      testFunction: () =>
        createNewLearningScenarioFromTemplate({
          originalLearningScenarioId: learningScenarioId,
          schoolId,
          user,
        }),
    },
    {
      functionName: shareLearningScenario.name,
      testFunction: () =>
        shareLearningScenario({
          data: { telliPointsPercentageLimit: 50, usageTimeLimit: 60 },
          learningScenarioId,
          schoolId,
          user,
        }),
    },
  ];
  const readByInviteCode = [
    {
      functionName: getSharedLearningScenario.name,
      testFunction: () =>
        getSharedLearningScenario({
          learningScenarioId,
          userId: user.id,
        }),
    },
  ];
  const unshare = [
    {
      functionName: unshareLearningScenario.name,
      testFunction: () =>
        unshareLearningScenario({
          learningScenarioId,
          user,
        }),
    },
  ];

  return [
    ...(modes.includes('read') ? readAccess : []),
    ...(modes.includes('read-by-invite-code') ? readByInviteCode : []),
    ...(modes.includes('write') ? writeAccess : []),
    ...(modes.includes('unshare') ? unshare : []),
  ].sort((a, b) => a.functionName.localeCompare(b.functionName));
}

describe('learning-scenario-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotFoundError scenarios', () => {
    const learningScenarioId = generateUUID();
    const schoolId = generateUUID();
    const user = mockUser();

    it.each(
      buildFunctionList(
        { learningScenarioId, schoolId, user },
        'read',
        'write',
        'read-by-invite-code',
      ),
    )(
      'should throw NotFoundError when learning scenario does not exist - $functionName',
      async ({ testFunction }) => {
        (
          dbGetLearningScenarioById as MockedFunction<typeof dbGetLearningScenarioById>
        ).mockResolvedValue(null as never);

        await expect(testFunction()).rejects.toThrowError(NotFoundError);
      },
    );
  });

  describe('ForbiddenError scenarios', () => {
    const userId = generateUUID();
    const learningScenarioId = generateUUID();
    let mockLearningScenario: Partial<LearningScenarioSelectModel>;

    beforeEach(() => {
      mockLearningScenario = {
        userId,
        id: learningScenarioId,
        name: 'Test Scenario',
      };
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

    describe('accessLevel=private and user not owner', () => {
      const differentUser = mockUser();

      beforeEach(() => {
        mockLearningScenario.accessLevel = 'private';
      });

      it.each(buildFunctionList({ learningScenarioId, user: differentUser }, 'read', 'write'))(
        'should throw ForbiddenError when user is not the owner - $functionName',
        async ({ testFunction }) => {
          await expect(testFunction()).rejects.toThrowError(ForbiddenError);
        },
      );
    });

    describe('accessLevel=school and user not in same school', () => {
      const differentUser = { ...mockUser(), schoolId: generateUUID() };

      beforeEach(() => {
        mockLearningScenario.accessLevel = 'school';
        mockLearningScenario.schoolId = generateUUID();
      });

      it.each(
        buildFunctionList(
          { learningScenarioId, schoolId: differentUser.schoolId, user: differentUser },
          'read',
        ),
      )(
        'should throw ForbiddenError when school shared but user is not in the same school - $functionName',
        async ({ testFunction }) => {
          await expect(testFunction()).rejects.toThrowError(ForbiddenError);
        },
      );
    });
  });

  describe('ForbiddenError scenarios - role restrictions', () => {
    const student = mockUser('student');

    it.each(buildFunctionList({ user: student }, 'read', 'write', 'unshare'))(
      'should throw ForbiddenError when user is not a teacher - $functionName',
      async ({ testFunction }) => {
        await expect(testFunction()).rejects.toThrowError(ForbiddenError);
      },
    );
  });

  describe('ForbiddenError scenarios - invalid arguments', () => {
    const user = mockUser();
    const learningScenarioId = generateUUID();
    const mockLearningScenario: Partial<LearningScenarioSelectModel> = {
      userId: user.id,
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
          learningScenarioId,
          user,
          accessLevel: 'global',
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('InvalidArgumentError scenarios - invalid parameter format', () => {
    it.each(
      buildFunctionList(
        { learningScenarioId: 'invalid-uuid' },
        'read',
        'write',
        'read-by-invite-code',
        'unshare',
      ),
    )(
      'should throw InvalidArgumentError when learningScenarioId is not a valid UUID - $functionName',
      async ({ testFunction }) => {
        await expect(testFunction()).rejects.toThrowError(InvalidArgumentError);
      },
    );
  });

  describe('Link sharing bypass scenarios', () => {
    const learningScenarioId = generateUUID();
    const ownerUserId = generateUUID();
    const ownerSchoolId = generateUUID();
    const differentUser = mockUser();
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
          user: differentUser,
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
            user: differentUser,
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
            user: differentUser,
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
            user: differentUser,
            schoolId: differentSchoolId,
          }),
        ).rejects.toThrowError(ForbiddenError);
      });
    });
  });

  describe('Success scenarios', () => {
    const userId = generateUUID();
    const schoolId = generateUUID();
    const learningScenarioId = generateUUID();
    let mockLearningScenario: Partial<LearningScenarioSelectModel>;

    beforeEach(() => {
      mockLearningScenario = {
        accessLevel: 'private',
        hasLinkAccess: false,
        id: learningScenarioId,
        name: 'Test Scenario',
        modelId: generateUUID(),
        schoolId,
        userId,
      };
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
        dbCreateLearningScenarioShare as MockedFunction<typeof dbCreateLearningScenarioShare>
      ).mockResolvedValue(mockLearningScenario as never);
      (
        dbGetSharedLearningScenarioConversations as MockedFunction<
          typeof dbGetSharedLearningScenarioConversations
        >
      ).mockResolvedValue([] as never);
    });

    describe('user is owner', () => {
      it.each(
        buildFunctionList({ learningScenarioId, user: { ...mockUser(), id: userId } }, 'read'),
      )('should not throw when user is the owner - $functionName', async ({ testFunction }) => {
        await expect(testFunction()).resolves.not.toThrow();
      });
    });

    describe('link is shared', () => {
      const differentUser = mockUser();

      beforeEach(() => {
        mockLearningScenario.hasLinkAccess = true;
      });

      it.each(buildFunctionList({ learningScenarioId, user: differentUser }, 'read'))(
        'should not throw when link is shared - $functionName',
        async ({ testFunction }) => {
          await expect(testFunction()).resolves.not.toThrow();
        },
      );
    });

    describe('shared with school', () => {
      const differentUser = { ...mockUser(), schoolId };

      beforeEach(() => {
        mockLearningScenario.accessLevel = 'school';
      });

      it.each(buildFunctionList({ learningScenarioId, schoolId, user: differentUser }, 'read'))(
        'should not throw when shared with school - $functionName',
        async ({ testFunction }) => {
          await expect(testFunction()).resolves.not.toThrow();
        },
      );
    });

    describe('shared globally', () => {
      const differentUser = mockUser();

      beforeEach(() => {
        mockLearningScenario.accessLevel = 'global';
      });

      it.each(buildFunctionList({ learningScenarioId, user: differentUser }, 'read'))(
        'should not throw when shared globally - $functionName',
        async ({ testFunction }) => {
          await expect(testFunction()).resolves.not.toThrow();
        },
      );
    });
  });
});
