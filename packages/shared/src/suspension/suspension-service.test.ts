import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import {
  getSuspensionRequestOverviews,
  getSuspensionRequestsForEntity,
  liftSuspensionOnEntity,
  markSuspensionRequestAsChecked,
  createSuspensionRequest,
  suspendEntity,
} from './suspension-service';
import { ForbiddenError, InvalidArgumentError, NotFoundError } from '@shared/error';
import { generateUUID } from '@shared/utils/uuid';
import { dbGetUserById } from '@shared/db/functions/user';
import {
  dbGetAssistantById,
  dbGetAssistantsByIds,
  dbSetAssistantSuspended,
} from '@shared/db/functions/assistants';
import {
  dbGetCharacterById,
  dbGetCharactersByIds,
  dbSetCharacterSuspended,
} from '@shared/db/functions/character';
import {
  dbGetLearningScenarioById,
  dbGetLearningScenariosByIds,
  dbSetLearningScenarioSuspended,
} from '@shared/db/functions/learning-scenario';
import {
  dbGetAllSuspensionRequests,
  dbCreateSuspensionRequest,
  dbGetSuspensionRequestsForEntity as dbGetSuspensionRequestsForEntityFn,
  dbMarkSuspensionRequestAsChecked,
} from '@shared/db/functions/suspension-requests';
import { verifyReadAccess } from '@shared/auth/authorization-service';

vi.mock('@shared/db/functions/user', () => ({
  dbGetUserById: vi.fn(),
}));

vi.mock('@shared/db/functions/assistants', () => ({
  dbGetAssistantById: vi.fn(),
  dbGetAssistantsByIds: vi.fn(),
  dbSetAssistantSuspended: vi.fn(),
}));

vi.mock('@shared/db/functions/character', () => ({
  dbGetCharacterById: vi.fn(),
  dbGetCharactersByIds: vi.fn(),
  dbSetCharacterSuspended: vi.fn(),
}));

vi.mock('@shared/db/functions/learning-scenario', () => ({
  dbGetLearningScenarioById: vi.fn(),
  dbGetLearningScenariosByIds: vi.fn(),
  dbSetLearningScenarioSuspended: vi.fn(),
}));

vi.mock('@shared/db/functions/suspension-requests', () => ({
  dbGetAllSuspensionRequests: vi.fn(),
  dbCreateSuspensionRequest: vi.fn(),
  dbGetSuspensionRequestsForEntity: vi.fn(),
  dbMarkSuspensionRequestAsChecked: vi.fn(),
}));

vi.mock('@shared/auth/authorization-service', () => ({
  verifyReadAccess: vi.fn(),
}));

describe('suspension-request-service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('createSuspensionRequest', () => {
    it('creates a suspension request for an accessible assistant', async () => {
      const assistantId = generateUUID();
      const requesterId = generateUUID();
      const suspensionRequestId = generateUUID();

      (dbGetUserById as MockedFunction<typeof dbGetUserById>).mockResolvedValue({
        id: requesterId,
        schoolIds: [generateUUID()],
      } as never);
      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue({
        id: assistantId,
        accessLevel: 'private',
        hasLinkAccess: false,
        userId: requesterId,
        ownerSchoolIds: [generateUUID()],
      } as never);
      (
        dbCreateSuspensionRequest as MockedFunction<typeof dbCreateSuspensionRequest>
      ).mockResolvedValue({
        id: suspensionRequestId,
      } as never);

      const result = await createSuspensionRequest({
        assistantId,
        requesterId,
        reason: 'other',
        description: 'Looks suspicious',
      });

      expect(verifyReadAccess).toHaveBeenCalledTimes(1);
      expect(dbCreateSuspensionRequest).toHaveBeenCalledWith({
        suspensionRequest: {
          assistantId,
          characterId: undefined,
          learningScenarioId: undefined,
          requesterId,
          reason: 'other',
          description: 'Looks suspicious',
        },
      });
      expect(result).toEqual({ id: suspensionRequestId });
    });

    it('throws if none or multiple target ids are provided', async () => {
      const requesterId = generateUUID();

      await expect(
        createSuspensionRequest({
          requesterId,
          reason: 'other',
          description: 'test',
        }),
      ).rejects.toThrow(InvalidArgumentError);

      await expect(
        createSuspensionRequest({
          assistantId: generateUUID(),
          characterId: generateUUID(),
          requesterId,
          reason: 'other',
          description: 'test',
        }),
      ).rejects.toThrow(InvalidArgumentError);
    });

    it('throws NotFoundError if requester does not exist', async () => {
      (dbGetUserById as MockedFunction<typeof dbGetUserById>).mockResolvedValue(undefined);

      await expect(
        createSuspensionRequest({
          assistantId: generateUUID(),
          requesterId: generateUUID(),
          reason: 'other',
          description: 'test',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError if assistant does not exist', async () => {
      (dbGetUserById as MockedFunction<typeof dbGetUserById>).mockResolvedValue({
        id: generateUUID(),
        schoolIds: [generateUUID()],
      } as never);
      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockRejectedValue(
        new NotFoundError('Assistant not found'),
      );

      await expect(
        createSuspensionRequest({
          assistantId: generateUUID(),
          requesterId: generateUUID(),
          reason: 'other',
          description: 'test',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('propagates ForbiddenError from verifyReadAccess', async () => {
      const assistantId = generateUUID();
      const requesterId = generateUUID();

      (dbGetUserById as MockedFunction<typeof dbGetUserById>).mockResolvedValue({
        id: requesterId,
        schoolIds: [generateUUID()],
      } as never);
      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue({
        id: assistantId,
        accessLevel: 'private',
        hasLinkAccess: false,
        userId: generateUUID(),
        ownerSchoolIds: [generateUUID()],
      } as never);
      (verifyReadAccess as MockedFunction<typeof verifyReadAccess>).mockImplementation(() => {
        throw new ForbiddenError('Not authorized for read access');
      });

      await expect(
        createSuspensionRequest({
          assistantId,
          requesterId,
          reason: 'other',
          description: 'test',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('creates a suspension request for an accessible character', async () => {
      const characterId = generateUUID();
      const requesterId = generateUUID();
      const suspensionRequestId = generateUUID();

      (dbGetUserById as MockedFunction<typeof dbGetUserById>).mockResolvedValue({
        id: requesterId,
        schoolIds: [generateUUID()],
      } as never);
      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue({
        id: characterId,
        accessLevel: 'private',
        hasLinkAccess: false,
        userId: requesterId,
        ownerSchoolIds: [generateUUID()],
      } as never);
      (
        dbCreateSuspensionRequest as MockedFunction<typeof dbCreateSuspensionRequest>
      ).mockResolvedValue({
        id: suspensionRequestId,
      } as never);

      const result = await createSuspensionRequest({
        characterId,
        requesterId,
        reason: 'other',
        description: 'Looks suspicious',
      });

      expect(dbCreateSuspensionRequest).toHaveBeenCalledWith({
        suspensionRequest: {
          assistantId: undefined,
          characterId,
          learningScenarioId: undefined,
          requesterId,
          reason: 'other',
          description: 'Looks suspicious',
        },
      });
      expect(result).toEqual({ id: suspensionRequestId });
    });

    it('throws NotFoundError if learning scenario does not exist', async () => {
      (dbGetUserById as MockedFunction<typeof dbGetUserById>).mockResolvedValue({
        id: generateUUID(),
        schoolIds: [generateUUID()],
      } as never);
      (
        dbGetLearningScenarioById as MockedFunction<typeof dbGetLearningScenarioById>
      ).mockResolvedValue(undefined);

      await expect(
        createSuspensionRequest({
          learningScenarioId: generateUUID(),
          requesterId: generateUUID(),
          reason: 'other',
          description: 'test',
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('markSuspensionRequestAsChecked', () => {
    it('marks suspension request as checked', async () => {
      const suspensionRequestId = generateUUID();
      (
        dbMarkSuspensionRequestAsChecked as MockedFunction<typeof dbMarkSuspensionRequestAsChecked>
      ).mockResolvedValue({ id: suspensionRequestId, checked: true } as never);

      const result = await markSuspensionRequestAsChecked(suspensionRequestId);

      expect(dbMarkSuspensionRequestAsChecked).toHaveBeenCalledWith({ suspensionRequestId });
      expect(result).toEqual({ id: suspensionRequestId, checked: true });
    });

    it('throws InvalidArgumentError for invalid uuid', async () => {
      await expect(markSuspensionRequestAsChecked('invalid-uuid')).rejects.toThrow(
        InvalidArgumentError,
      );
    });
  });

  describe('suspendEntity / liftSuspensionOnEntity', () => {
    it('suspends and unsuspends assistant', async () => {
      const assistantId = generateUUID();
      (dbSetAssistantSuspended as MockedFunction<typeof dbSetAssistantSuspended>).mockResolvedValue(
        { id: assistantId, suspended: true } as never,
      );

      await suspendEntity({ assistantId });
      expect(dbSetAssistantSuspended).toHaveBeenCalledWith({ assistantId, suspended: true });

      await liftSuspensionOnEntity({ assistantId });
      expect(dbSetAssistantSuspended).toHaveBeenCalledWith({ assistantId, suspended: false });
    });

    it('suspends and unsuspends character', async () => {
      const characterId = generateUUID();

      await suspendEntity({ characterId });
      expect(dbSetCharacterSuspended).toHaveBeenCalledWith({ characterId, suspended: true });

      await liftSuspensionOnEntity({ characterId });
      expect(dbSetCharacterSuspended).toHaveBeenCalledWith({ characterId, suspended: false });
    });

    it('suspends and unsuspends learning scenario', async () => {
      const learningScenarioId = generateUUID();

      await suspendEntity({ learningScenarioId });
      expect(dbSetLearningScenarioSuspended).toHaveBeenCalledWith({
        learningScenarioId,
        suspended: true,
      });

      await liftSuspensionOnEntity({ learningScenarioId });
      expect(dbSetLearningScenarioSuspended).toHaveBeenCalledWith({
        learningScenarioId,
        suspended: false,
      });
    });

    it('throws if none or multiple target ids are provided', async () => {
      await expect(suspendEntity({})).rejects.toThrow(InvalidArgumentError);
      await expect(
        suspendEntity({
          assistantId: generateUUID(),
          characterId: generateUUID(),
        }),
      ).rejects.toThrow(InvalidArgumentError);
    });
  });

  describe('getSuspensionRequestOverviews', () => {
    it('returns grouped suspension request overviews sorted by latest suspension request date', async () => {
      const assistantId = generateUUID();
      const characterId = generateUUID();
      const requesterId = generateUUID();
      const requestId1 = generateUUID();
      const requestId2 = generateUUID();
      const requestId3 = generateUUID();

      (
        dbGetAllSuspensionRequests as MockedFunction<typeof dbGetAllSuspensionRequests>
      ).mockResolvedValue([
        {
          id: requestId1,
          assistantId,
          characterId: null,
          learningScenarioId: null,
          requesterId,
          reason: 'discrimination',
          description: 'a',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          checked: false,
        },
        {
          id: requestId2,
          assistantId,
          characterId: null,
          learningScenarioId: null,
          requesterId,
          reason: 'other',
          description: 'b',
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          checked: true,
        },
        {
          id: requestId3,
          assistantId: null,
          characterId,
          learningScenarioId: null,
          requesterId,
          reason: 'other',
          description: 'c',
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
          checked: true,
        },
      ] as never);

      (dbGetAssistantsByIds as MockedFunction<typeof dbGetAssistantsByIds>).mockResolvedValue([
        {
          id: assistantId,
          name: 'Assistant A',
          suspended: false,
        },
      ] as never);
      (dbGetCharactersByIds as MockedFunction<typeof dbGetCharactersByIds>).mockResolvedValue([
        {
          id: characterId,
          name: 'Character C',
          suspended: true,
        },
      ] as never);
      (
        dbGetLearningScenariosByIds as MockedFunction<typeof dbGetLearningScenariosByIds>
      ).mockResolvedValue([] as never);

      const result = await getSuspensionRequestOverviews();

      expect(result).toHaveLength(2);
      const first = result.at(0);
      const second = result.at(1);
      expect(first).toBeDefined();
      expect(second).toBeDefined();

      expect(first?.entityType).toBe('character');
      expect(first?.status).toBe('suspended');
      expect(first?.reasons).toHaveLength(1);
      expect(first?.reasons).toEqual(expect.arrayContaining([{ id: requestId3, reason: 'other' }]));
      expect(second?.entityType).toBe('assistant');
      expect(second?.requestCount).toBe(2);
      expect(second?.status).toBe('new');
      expect(second?.reasons).toHaveLength(2);
      expect(second?.reasons).toEqual(
        expect.arrayContaining([
          { id: requestId1, reason: 'discrimination' },
          { id: requestId2, reason: 'other' },
        ]),
      );
    });

    it('throws NotFoundError when grouped character cannot be resolved', async () => {
      const characterId = generateUUID();

      (
        dbGetAllSuspensionRequests as MockedFunction<typeof dbGetAllSuspensionRequests>
      ).mockResolvedValue([
        {
          id: generateUUID(),
          assistantId: null,
          characterId,
          learningScenarioId: null,
          requesterId: generateUUID(),
          reason: 'other',
          description: 'c',
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
          checked: true,
        },
      ] as never);

      (dbGetAssistantsByIds as MockedFunction<typeof dbGetAssistantsByIds>).mockResolvedValue(
        [] as never,
      );
      (dbGetCharactersByIds as MockedFunction<typeof dbGetCharactersByIds>).mockResolvedValue(
        [] as never,
      );
      (
        dbGetLearningScenariosByIds as MockedFunction<typeof dbGetLearningScenariosByIds>
      ).mockResolvedValue([] as never);

      await expect(getSuspensionRequestOverviews()).rejects.toThrow(NotFoundError);
    });

    it('returns learning scenario overview with checked status', async () => {
      const learningScenarioId = generateUUID();
      const requestId = generateUUID();

      (
        dbGetAllSuspensionRequests as MockedFunction<typeof dbGetAllSuspensionRequests>
      ).mockResolvedValue([
        {
          id: requestId,
          assistantId: null,
          characterId: null,
          learningScenarioId,
          requesterId: generateUUID(),
          reason: 'other',
          description: 'l',
          createdAt: new Date('2026-01-04T00:00:00.000Z'),
          checked: true,
        },
      ] as never);

      (dbGetAssistantsByIds as MockedFunction<typeof dbGetAssistantsByIds>).mockResolvedValue(
        [] as never,
      );
      (dbGetCharactersByIds as MockedFunction<typeof dbGetCharactersByIds>).mockResolvedValue(
        [] as never,
      );
      (
        dbGetLearningScenariosByIds as MockedFunction<typeof dbGetLearningScenariosByIds>
      ).mockResolvedValue([
        {
          id: learningScenarioId,
          name: 'Scenario L',
          suspended: false,
        },
      ] as never);

      const result = await getSuspensionRequestOverviews();

      expect(result).toHaveLength(1);
      expect(result[0]?.entityType).toBe('learningScenario');
      expect(result[0]?.status).toBe('checked');
      expect(result[0]?.reasons).toEqual([{ id: requestId, reason: 'other' }]);
    });
  });

  describe('getSuspensionRequestsForEntity', () => {
    it('returns suspension requests for target entity', async () => {
      const assistantId = generateUUID();
      (
        dbGetSuspensionRequestsForEntityFn as MockedFunction<
          typeof dbGetSuspensionRequestsForEntityFn
        >
      ).mockResolvedValue([{ id: generateUUID(), assistantId }] as never);

      const result = await getSuspensionRequestsForEntity({ assistantId });

      expect(dbGetSuspensionRequestsForEntityFn).toHaveBeenCalledWith({
        assistantId,
        characterId: undefined,
        learningScenarioId: undefined,
      });
      expect(result).toHaveLength(1);
    });

    it('throws if none or multiple target ids are provided', async () => {
      await expect(getSuspensionRequestsForEntity({})).rejects.toThrow(InvalidArgumentError);
      await expect(
        getSuspensionRequestsForEntity({
          characterId: generateUUID(),
          learningScenarioId: generateUUID(),
        }),
      ).rejects.toThrow(InvalidArgumentError);
    });
  });
});
