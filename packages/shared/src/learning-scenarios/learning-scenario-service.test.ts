import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import {
  createNewLearningScenarioFromTemplate,
  deleteLearningScenario,
  downloadFileFromLearningScenario,
  getFilesForLearningScenario,
  getLearningScenariosByAccessLevel,
  getLearningScenariosByOverviewFilter,
  getLearningScenariosForUser,
  getLearningScenario,
  getSharedLearningScenario,
  linkFileToLearningScenario,
  removeFileFromLearningScenario,
  shareLearningScenario,
  unshareLearningScenario,
  updateLearningScenario,
  updateLearningScenarioAccessLevel,
  uploadAvatarPictureForLearningScenario,
} from './learning-scenario-service';
import {
  dbGetAllAccessibleLearningScenarios,
  dbGetAllLearningScenariosByUser,
  dbCreateLearningScenarioShare,
  dbGetGlobalLearningScenarios,
  dbGetLearningScenarioById,
  dbGetLearningScenarioByIdOptionalShareData,
  dbGetLearningScenarioByIdWithShareData,
  dbGetLearningScenariosByAssociatedSchools,
  dbGetLearningScenariosByUser,
  dbGetSharedLearningScenarioConversations,
} from '../db/functions/learning-scenario';
import { dbGetFileForLearningScenario, dbGetFilesForLearningScenario } from '../db/functions/files';
import { getAvatarPictureUrl } from '../files/fileService';
import { generateUUID } from '../utils/uuid';
import { LearningScenarioSelectModel } from '@shared/db/schema';
import { ForbiddenError, InvalidArgumentError, NotFoundError } from '@shared/error';
import { UserModel } from '@shared/auth/user-model';
import { getReadOnlySignedUrl, uploadFileToS3 } from '../s3';

vi.mock('../db/functions/learning-scenario', () => ({
  dbGetAllAccessibleLearningScenarios: vi.fn(),
  dbGetAllLearningScenariosByUser: vi.fn(),
  dbCreateLearningScenarioShare: vi.fn(),
  dbGetGlobalLearningScenarios: vi.fn(),
  dbGetLearningScenarioById: vi.fn(),
  dbGetLearningScenarioByIdOptionalShareData: vi.fn(),
  dbGetLearningScenarioByIdWithShareData: vi.fn(),
  dbGetLearningScenariosByAssociatedSchools: vi.fn(),
  dbGetLearningScenariosByUser: vi.fn(),
  dbGetSharedLearningScenarioConversations: vi.fn(),
}));
vi.mock('./learning-scenario-admin-service', () => ({
  duplicateLearningScenario: vi.fn(),
}));
vi.mock('../db/functions/files', () => ({
  dbGetFileForLearningScenario: vi.fn(),
  dbGetFilesForLearningScenario: vi.fn(),
}));
vi.mock('../files/fileService', () => ({
  getAvatarPictureUrl: vi.fn(),
  deleteAvatarPicture: vi.fn(),
  deleteMessageAttachments: vi.fn(),
}));
vi.mock('../s3', () => ({
  getReadOnlySignedUrl: vi.fn(),
  uploadFileToS3: vi.fn(),
  deleteFileFromS3: vi.fn(),
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

function buildFunctionList(
  {
    learningScenarioId,
    user,
  }: {
    learningScenarioId?: string;
    user?: UserModel;
  },
  ...modes: ('read' | 'write' | 'unshare' | 'read-by-invite-code')[]
) {
  const fileId = generateUUID();
  learningScenarioId ??= generateUUID();
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
      functionName: getLearningScenario.name,
      testFunction: () =>
        getLearningScenario({
          learningScenarioId,
          user,
        }),
    },
    {
      functionName: createNewLearningScenarioFromTemplate.name,
      testFunction: () =>
        createNewLearningScenarioFromTemplate({
          originalLearningScenarioId: learningScenarioId,
          user,
        }),
    },
    {
      functionName: shareLearningScenario.name,
      testFunction: () =>
        shareLearningScenario({
          data: { telliPointsPercentageLimit: 50, usageTimeLimit: 60 },
          learningScenarioId,
          user,
        }),
    },
    {
      functionName: downloadFileFromLearningScenario.name,
      testFunction: () =>
        downloadFileFromLearningScenario({
          learningScenarioId,
          fileId,
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
          user,
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
    const user = mockUser();

    it.each(
      buildFunctionList({ learningScenarioId, user }, 'read', 'write', 'read-by-invite-code'),
    )(
      'should throw NotFoundError when learning scenario does not exist - $functionName',
      async ({ testFunction }) => {
        (
          dbGetLearningScenarioById as MockedFunction<typeof dbGetLearningScenarioById>
        ).mockResolvedValue(null as never);

        await expect(testFunction()).rejects.toThrow(NotFoundError);
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
          await expect(testFunction()).rejects.toThrow(ForbiddenError);
        },
      );
    });

    describe('accessLevel=school and user not in same school', () => {
      const differentUser = { ...mockUser(), schoolIds: ['viewer-school-id'] };

      beforeEach(() => {
        mockLearningScenario.accessLevel = 'school';
        mockLearningScenario.ownerSchoolIds = ['owner-school-id'];
      });

      it.each(buildFunctionList({ learningScenarioId, user: differentUser }, 'read', 'write'))(
        'should throw ForbiddenError when school shared but user is not in the same school - $functionName',
        async ({ testFunction }) => {
          await expect(testFunction()).rejects.toThrow(ForbiddenError);
        },
      );
    });
  });

  describe('ForbiddenError scenarios - role restrictions', () => {
    const student = mockUser('student');

    it.each(buildFunctionList({ user: student }, 'read', 'write', 'unshare'))(
      'should throw ForbiddenError when user is not a teacher - $functionName',
      async ({ testFunction }) => {
        await expect(testFunction()).rejects.toThrow(ForbiddenError);
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
      ).rejects.toThrow(ForbiddenError);
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
        await expect(testFunction()).rejects.toThrow(InvalidArgumentError);
      },
    );
  });

  describe('Link sharing bypass scenarios', () => {
    const learningScenarioId = generateUUID();
    const ownerUserId = generateUUID();
    const differentUser = mockUser();

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
      ])('getLearningScenario - $description', async ({ accessLevel }) => {
        const mockLearningScenario = {
          id: learningScenarioId,
          userId: ownerUserId,
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
        const result = await getLearningScenario({
          learningScenarioId,
          user: differentUser,
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
          }),
        ).resolves.not.toThrow();
      });
    });

    describe('should still enforce restrictions when hasLinkAccess is false', () => {
      it('getLearningScenario - private learning scenario without link sharing', async () => {
        const mockLearningScenario = {
          id: learningScenarioId,
          userId: ownerUserId,
          accessLevel: 'private' as const,
          hasLinkAccess: false,
        };

        (
          dbGetLearningScenarioByIdOptionalShareData as MockedFunction<
            typeof dbGetLearningScenarioByIdOptionalShareData
          >
        ).mockResolvedValue(mockLearningScenario as never);

        await expect(
          getLearningScenario({
            learningScenarioId,
            user: differentUser,
          }),
        ).rejects.toThrow(ForbiddenError);
      });

      it('getFilesForLearningScenario - private learning scenario without link sharing', async () => {
        const mockLearningScenario: Partial<LearningScenarioSelectModel> = {
          userId: ownerUserId,
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
          }),
        ).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe('Success scenarios', () => {
    const userId = generateUUID();
    const sharedSchoolId = generateUUID();
    const learningScenarioId = generateUUID();
    let mockLearningScenario: Partial<LearningScenarioSelectModel>;

    beforeEach(() => {
      mockLearningScenario = {
        accessLevel: 'private',
        hasLinkAccess: false,
        id: learningScenarioId,
        name: 'Test Scenario',
        modelId: generateUUID(),
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
      (
        dbGetFileForLearningScenario as MockedFunction<typeof dbGetFileForLearningScenario>
      ).mockResolvedValue({} as never);
      (getReadOnlySignedUrl as MockedFunction<typeof getReadOnlySignedUrl>).mockResolvedValue(
        undefined,
      );
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
      const differentUser = { ...mockUser(), schoolIds: [sharedSchoolId] };

      beforeEach(() => {
        mockLearningScenario.accessLevel = 'school';
        mockLearningScenario.ownerSchoolIds = [sharedSchoolId];
      });

      it.each(buildFunctionList({ learningScenarioId, user: differentUser }, 'read'))(
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

  describe('uploadAvatarPictureForLearningScenario', () => {
    const learningScenarioId = generateUUID();
    const user = mockUser();

    beforeEach(() => {
      const mockLearningScenario: Partial<LearningScenarioSelectModel> = {
        id: learningScenarioId,
        userId: user.id,
        accessLevel: 'private',
        pictureId: null,
      };
      (
        dbGetLearningScenarioById as MockedFunction<typeof dbGetLearningScenarioById>
      ).mockResolvedValue(mockLearningScenario as never);
      (uploadFileToS3 as MockedFunction<typeof uploadFileToS3>).mockResolvedValue(
        undefined as never,
      );
      mockDbReturning.mockResolvedValue([
        {
          id: learningScenarioId,
          userId: user.id,
          pictureId: `shared-chats/${learningScenarioId}/avatar_abc123`,
        },
      ]);
      (getAvatarPictureUrl as MockedFunction<typeof getAvatarPictureUrl>).mockResolvedValue(
        'https://signed-url',
      );
    });

    it('should upload avatar, update db and return picturePath and signedUrl', async () => {
      const result = await uploadAvatarPictureForLearningScenario({
        learningScenarioId,
        user,
        croppedImageBlob: new Blob(['data'], { type: 'image/png' }),
      });

      expect(uploadFileToS3).toHaveBeenCalled();
      expect(mockDbUpdate).toHaveBeenCalled();
      expect(result).toEqual({
        picturePath: `shared-chats/${learningScenarioId}/avatar_3a6eb0790f39`,
        signedUrl: 'https://signed-url',
      });
    });
  });

  describe('unshareLearningScenario - NotFoundError when no active share', () => {
    const learningScenarioId = generateUUID();
    const user = mockUser('teacher');
    beforeEach(() => {
      (
        dbGetSharedLearningScenarioConversations as MockedFunction<
          typeof dbGetSharedLearningScenarioConversations
        >
      ).mockResolvedValue([] as never);
    });

    it('throws NotFoundError when the teacher has no active share to stop', async () => {
      await expect(unshareLearningScenario({ learningScenarioId, user })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('shareLearningScenario - success', () => {
    const userId = generateUUID();
    const learningScenarioId = generateUUID();
    const user = { ...mockUser(), id: userId };
    const mockLearningScenario: Partial<LearningScenarioSelectModel> = {
      id: learningScenarioId,
      userId,
      accessLevel: 'private',
      hasLinkAccess: false,
      name: 'Test Scenario',
    };
    const newShare = {
      id: generateUUID(),
      learningScenarioId,
      userId,
      telliPointsLimit: 50,
      maxUsageTimeLimit: 60,
      inviteCode: 'ABCD1234',
      startedAt: new Date(),
      manuallyStoppedAt: null,
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
        dbCreateLearningScenarioShare as MockedFunction<typeof dbCreateLearningScenarioShare>
      ).mockResolvedValue(newShare as never);
      (
        dbGetSharedLearningScenarioConversations as MockedFunction<
          typeof dbGetSharedLearningScenarioConversations
        >
      ).mockResolvedValue([] as never);
    });

    it('throws an error when there is already an active share', async () => {
      (
        dbGetSharedLearningScenarioConversations as MockedFunction<
          typeof dbGetSharedLearningScenarioConversations
        >
      ).mockResolvedValue([newShare] as never);

      await expect(
        shareLearningScenario({
          learningScenarioId,
          data: { telliPointsPercentageLimit: 50, usageTimeLimit: 60 },
          user,
        }),
      ).rejects.toThrow('There can only be one active share at a time');
    });
  });

  describe('learning scenario discovery filters', () => {
    const user = mockUser('teacher');
    const scenarios = [{ id: generateUUID(), name: 'Scenario 1' } as LearningScenarioSelectModel];

    it('filters out unnamed scenarios and enriches with picture URLs', async () => {
      const namedScenario = {
        id: generateUUID(),
        name: 'Visible scenario',
        pictureId: 'shared-chats/a/picture.png',
      } as LearningScenarioSelectModel;
      const unnamedScenario = {
        id: generateUUID(),
        name: '',
        pictureId: 'shared-chats/b/picture.png',
      } as LearningScenarioSelectModel;

      (
        dbGetLearningScenariosByUser as MockedFunction<typeof dbGetLearningScenariosByUser>
      ).mockResolvedValue([namedScenario, unnamedScenario] as never);
      (getAvatarPictureUrl as MockedFunction<typeof getAvatarPictureUrl>).mockResolvedValue(
        'https://signed-url',
      );

      const result = await getLearningScenariosForUser({ user });

      expect(dbGetLearningScenariosByUser).toHaveBeenCalledWith({ user });
      expect(result).toEqual([
        {
          ...namedScenario,
          maybeSignedPictureUrl: 'https://signed-url',
        },
      ]);
    });

    it.each([
      {
        accessLevel: 'global' as const,
        expectedMock: dbGetGlobalLearningScenarios,
      },
      {
        accessLevel: 'school' as const,
        expectedMock: dbGetLearningScenariosByAssociatedSchools,
      },
      {
        accessLevel: 'private' as const,
        expectedMock: dbGetLearningScenariosByUser,
      },
    ])(
      'routes accessLevel=$accessLevel to the correct db function',
      async ({ accessLevel, expectedMock }) => {
        (expectedMock as MockedFunction<typeof expectedMock>).mockResolvedValue(scenarios as never);

        const result = await getLearningScenariosByAccessLevel({ accessLevel, user });

        expect(result).toEqual(scenarios);
        expect(expectedMock).toHaveBeenCalledWith({ user });
      },
    );

    it('returns an empty list for unsupported access levels', async () => {
      const result = await getLearningScenariosByAccessLevel({
        accessLevel: 'invalid' as never,
        user,
      });

      expect(result).toEqual([]);
    });

    it('routes filter=all to dbGetAllAccessibleLearningScenarios', async () => {
      (
        dbGetAllAccessibleLearningScenarios as MockedFunction<
          typeof dbGetAllAccessibleLearningScenarios
        >
      ).mockResolvedValue(scenarios as never);

      const result = await getLearningScenariosByOverviewFilter({ filter: 'all', user });

      expect(result).toEqual(scenarios);
      expect(dbGetAllAccessibleLearningScenarios).toHaveBeenCalledWith({ user });
    });

    it.each([
      { filter: 'mine' as const, expectedMock: dbGetAllLearningScenariosByUser },
      { filter: 'official' as const, expectedMock: dbGetGlobalLearningScenarios },
      { filter: 'school' as const, expectedMock: dbGetLearningScenariosByAssociatedSchools },
    ])('routes filter=$filter to the correct db function', async ({ filter, expectedMock }) => {
      (expectedMock as MockedFunction<typeof expectedMock>).mockResolvedValue(scenarios as never);

      const result = await getLearningScenariosByOverviewFilter({ filter, user });

      expect(result).toEqual(scenarios);
      expect(expectedMock).toHaveBeenCalledWith({ user });
    });

    it('returns an empty list for unsupported overview filters', async () => {
      const result = await getLearningScenariosByOverviewFilter({
        filter: 'invalid' as never,
        user,
      });

      expect(result).toEqual([]);
    });
  });
});
