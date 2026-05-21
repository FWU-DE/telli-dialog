import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import {
  getEntityReportOverviews,
  getReportsForEntity,
  liftSuspensionOnEntity,
  markReportAsChecked,
  reportEntity,
  suspendEntity,
} from './report-service';
import { ForbiddenError, InvalidArgumentError, NotFoundError } from '@shared/error';
import { generateUUID } from '@shared/utils/uuid';
import { dbGetUserById } from '@shared/db/functions/user';
import { dbGetAssistantById, dbSetAssistantSuspended } from '@shared/db/functions/assistants';
import { dbGetCharacterById, dbSetCharacterSuspended } from '@shared/db/functions/character';
import { dbSetLearningScenarioSuspended } from '@shared/db/functions/learning-scenario';
import {
  dbGetAllEntityReports,
  dbCreateEntityReport,
  dbGetReportsForEntity as dbGetReportsForEntityFn,
  dbMarkEntityReportAsChecked,
} from '@shared/db/functions/reports';
import { verifyReadAccess } from '@shared/auth/authorization-service';

vi.mock('@shared/db/functions/user', () => ({
  dbGetUserById: vi.fn(),
}));

vi.mock('@shared/db/functions/assistants', () => ({
  dbGetAssistantById: vi.fn(),
  dbSetAssistantSuspended: vi.fn(),
}));

vi.mock('@shared/db/functions/character', () => ({
  dbGetCharacterById: vi.fn(),
  dbSetCharacterSuspended: vi.fn(),
}));

vi.mock('@shared/db/functions/learning-scenario', () => ({
  dbGetLearningScenarioById: vi.fn(),
  dbSetLearningScenarioSuspended: vi.fn(),
}));

vi.mock('@shared/db/functions/reports', () => ({
  dbGetAllEntityReports: vi.fn(),
  dbCreateEntityReport: vi.fn(),
  dbGetReportsForEntity: vi.fn(),
  dbMarkEntityReportAsChecked: vi.fn(),
}));

vi.mock('@shared/auth/authorization-service', () => ({
  verifyReadAccess: vi.fn(),
}));

describe('report-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reportEntity', () => {
    it('creates a report for an accessible assistant', async () => {
      const assistantId = generateUUID();
      const reporterId = generateUUID();
      const reportId = generateUUID();

      (dbGetUserById as MockedFunction<typeof dbGetUserById>).mockResolvedValue({
        id: reporterId,
        schoolIds: [generateUUID()],
      } as never);
      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue({
        id: assistantId,
        accessLevel: 'private',
        hasLinkAccess: false,
        userId: reporterId,
        ownerSchoolIds: [generateUUID()],
      } as never);
      (dbCreateEntityReport as MockedFunction<typeof dbCreateEntityReport>).mockResolvedValue({
        id: reportId,
      } as never);

      const result = await reportEntity({
        assistantId,
        reporterId,
        reason: 'other',
        description: 'Looks suspicious',
      });

      expect(verifyReadAccess).toHaveBeenCalledTimes(1);
      expect(dbCreateEntityReport).toHaveBeenCalledWith({
        report: {
          assistantId,
          characterId: undefined,
          learningScenarioId: undefined,
          reporterId,
          reason: 'other',
          description: 'Looks suspicious',
        },
      });
      expect(result).toEqual({ id: reportId });
    });

    it('throws if none or multiple target ids are provided', async () => {
      const reporterId = generateUUID();

      await expect(
        reportEntity({
          reporterId,
          reason: 'other',
          description: 'test',
        }),
      ).rejects.toThrow(InvalidArgumentError);

      await expect(
        reportEntity({
          assistantId: generateUUID(),
          characterId: generateUUID(),
          reporterId,
          reason: 'other',
          description: 'test',
        }),
      ).rejects.toThrow(InvalidArgumentError);
    });

    it('throws NotFoundError if reporter does not exist', async () => {
      (dbGetUserById as MockedFunction<typeof dbGetUserById>).mockResolvedValue(undefined);

      await expect(
        reportEntity({
          assistantId: generateUUID(),
          reporterId: generateUUID(),
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
        reportEntity({
          assistantId: generateUUID(),
          reporterId: generateUUID(),
          reason: 'other',
          description: 'test',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('propagates ForbiddenError from verifyReadAccess', async () => {
      const assistantId = generateUUID();
      const reporterId = generateUUID();

      (dbGetUserById as MockedFunction<typeof dbGetUserById>).mockResolvedValue({
        id: reporterId,
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
        reportEntity({
          assistantId,
          reporterId,
          reason: 'other',
          description: 'test',
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('markReportAsChecked', () => {
    it('marks report as checked', async () => {
      const reportId = generateUUID();
      (
        dbMarkEntityReportAsChecked as MockedFunction<typeof dbMarkEntityReportAsChecked>
      ).mockResolvedValue({ id: reportId, checked: true } as never);

      const result = await markReportAsChecked(reportId);

      expect(dbMarkEntityReportAsChecked).toHaveBeenCalledWith({ reportId });
      expect(result).toEqual({ id: reportId, checked: true });
    });

    it('throws InvalidArgumentError for invalid uuid', async () => {
      await expect(markReportAsChecked('invalid-uuid')).rejects.toThrow(InvalidArgumentError);
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

  describe('getEntityReportOverviews', () => {
    it('returns grouped report overviews sorted by report count', async () => {
      const assistantId = generateUUID();
      const characterId = generateUUID();
      const reporterId = generateUUID();

      (dbGetAllEntityReports as MockedFunction<typeof dbGetAllEntityReports>).mockResolvedValue([
        {
          id: generateUUID(),
          assistantId,
          characterId: null,
          learningScenarioId: null,
          reporterId,
          reason: 'discrimination',
          description: 'a',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          checked: false,
        },
        {
          id: generateUUID(),
          assistantId,
          characterId: null,
          learningScenarioId: null,
          reporterId,
          reason: 'other',
          description: 'b',
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          checked: true,
        },
        {
          id: generateUUID(),
          assistantId: null,
          characterId,
          learningScenarioId: null,
          reporterId,
          reason: 'other',
          description: 'c',
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
          checked: true,
        },
      ] as never);

      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue({
        id: assistantId,
        name: 'Assistant A',
        suspended: false,
      } as never);
      (dbGetCharacterById as MockedFunction<typeof dbGetCharacterById>).mockResolvedValue({
        id: characterId,
        name: 'Character C',
        suspended: true,
      } as never);

      const result = await getEntityReportOverviews();

      expect(result).toHaveLength(2);
      const first = result.at(0);
      const second = result.at(1);
      expect(first).toBeDefined();
      expect(second).toBeDefined();

      expect(first?.entityType).toBe('assistant');
      expect(first?.reportCount).toBe(2);
      expect(first?.status).toBe('new');
      expect(first?.reasons).toEqual(['discrimination', 'other']);
      expect(second?.entityType).toBe('character');
      expect(second?.status).toBe('suspended');
      expect(second?.reasons).toEqual(['other']);
    });

    it('applies limit and validates limit input', async () => {
      (dbGetAllEntityReports as MockedFunction<typeof dbGetAllEntityReports>).mockResolvedValue(
        [] as never,
      );

      const limitedResult = await getEntityReportOverviews({ limit: 1 });
      expect(limitedResult).toEqual([]);

      await expect(getEntityReportOverviews({ limit: 0 })).rejects.toThrow(InvalidArgumentError);
    });
  });

  describe('getReportsForEntity', () => {
    it('returns reports for target entity', async () => {
      const assistantId = generateUUID();
      (dbGetReportsForEntityFn as MockedFunction<typeof dbGetReportsForEntityFn>).mockResolvedValue(
        [{ id: generateUUID(), assistantId }] as never,
      );

      const result = await getReportsForEntity({ assistantId });

      expect(dbGetReportsForEntityFn).toHaveBeenCalledWith({
        assistantId,
        characterId: undefined,
        learningScenarioId: undefined,
      });
      expect(result).toHaveLength(1);
    });

    it('throws if none or multiple target ids are provided', async () => {
      await expect(getReportsForEntity({})).rejects.toThrow(InvalidArgumentError);
      await expect(
        getReportsForEntity({
          characterId: generateUUID(),
          learningScenarioId: generateUUID(),
        }),
      ).rejects.toThrow(InvalidArgumentError);
    });
  });
});
