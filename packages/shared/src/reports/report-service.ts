import { z } from 'zod';
import { verifyReadAccess } from '@shared/auth/authorization-service';
import { dbGetAssistantById, dbSetAssistantSuspended } from '@shared/db/functions/assistants';
import { dbGetCharacterById, dbSetCharacterSuspended } from '@shared/db/functions/character';
import {
  dbGetLearningScenarioById,
  dbSetLearningScenarioSuspended,
} from '@shared/db/functions/learning-scenario';
import {
  dbCreateEntityReport,
  dbGetAllEntityReports,
  dbGetReportsForEntity,
  dbMarkEntityReportAsChecked,
} from '@shared/db/functions/reports';
import { dbGetUserById } from '@shared/db/functions/user';
import { entityReportReasonSchema } from '@shared/db/schema';
import { InvalidArgumentError, NotFoundError, checkParameterUUID } from '@shared/error';

const reportDescriptionSchema = z.string().min(1).max(500);

type ReportTargetIds = {
  assistantId?: string;
  characterId?: string;
  learningScenarioId?: string;
};

type EntityType = 'assistant' | 'character' | 'learningScenario';

type ReportOverviewStatus = 'new' | 'suspended' | 'checked';

export type EntityReportOverview = {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  reportCount: number;
  status: ReportOverviewStatus;
  latestReportAt: Date;
  reasons: string[];
};

function validateSingleTargetAndUuid({
  assistantId,
  characterId,
  learningScenarioId,
}: ReportTargetIds) {
  const providedIds = [assistantId, characterId, learningScenarioId].filter(
    (id): id is string => id !== undefined,
  );

  if (providedIds.length !== 1) {
    throw new InvalidArgumentError('Exactly one target entity id must be provided');
  }

  checkParameterUUID(...providedIds);
}

async function resolveTargetEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: ReportTargetIds) {
  if (assistantId) {
    const assistant = await dbGetAssistantById({ assistantId });
    if (!assistant) {
      throw new NotFoundError('Assistant not found');
    }

    return assistant;
  }

  if (characterId) {
    const character = await dbGetCharacterById({ characterId });
    if (!character) {
      throw new NotFoundError('Character not found');
    }

    return character;
  }

  if (learningScenarioId) {
    const learningScenario = await dbGetLearningScenarioById({ learningScenarioId });
    if (!learningScenario) {
      throw new NotFoundError('Learning scenario not found');
    }

    return learningScenario;
  }

  throw new InvalidArgumentError('Exactly one target entity id must be provided');
}

export async function reportEntity({
  assistantId,
  characterId,
  learningScenarioId,
  reporterId,
  reason,
  description,
}: ReportTargetIds & {
  reporterId: string;
  reason: string;
  description: string;
}) {
  validateSingleTargetAndUuid({ assistantId, characterId, learningScenarioId });
  checkParameterUUID(reporterId);

  const validatedReason = entityReportReasonSchema.parse(reason);
  const validatedDescription = reportDescriptionSchema.parse(description);

  const reporter = await dbGetUserById({ userId: reporterId });
  if (!reporter) {
    throw new NotFoundError('Reporter not found');
  }

  const targetEntity = await resolveTargetEntity({ assistantId, characterId, learningScenarioId });
  verifyReadAccess({
    item: targetEntity,
    user: reporter,
  });

  return dbCreateEntityReport({
    report: {
      assistantId,
      characterId,
      learningScenarioId,
      reporterId,
      reason: validatedReason,
      description: validatedDescription,
    },
  });
}

export async function markReportAsChecked(reportId: string) {
  checkParameterUUID(reportId);
  return dbMarkEntityReportAsChecked({ reportId });
}

export async function suspendEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: ReportTargetIds) {
  validateSingleTargetAndUuid({ assistantId, characterId, learningScenarioId });

  if (assistantId) {
    return dbSetAssistantSuspended({ assistantId, suspended: true });
  }

  if (characterId) {
    return dbSetCharacterSuspended({ characterId, suspended: true });
  }

  if (learningScenarioId) {
    return dbSetLearningScenarioSuspended({ learningScenarioId, suspended: true });
  }

  throw new InvalidArgumentError('Exactly one target entity id must be provided');
}

export async function liftSuspensionOnEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: ReportTargetIds) {
  validateSingleTargetAndUuid({ assistantId, characterId, learningScenarioId });

  if (assistantId) {
    return dbSetAssistantSuspended({ assistantId, suspended: false });
  }

  if (characterId) {
    return dbSetCharacterSuspended({ characterId, suspended: false });
  }

  if (learningScenarioId) {
    return dbSetLearningScenarioSuspended({ learningScenarioId, suspended: false });
  }

  throw new InvalidArgumentError('Exactly one target entity id must be provided');
}

export async function getEntityReportOverviews({
  limit,
}: {
  limit?: number;
} = {}): Promise<EntityReportOverview[]> {
  const allReports = await dbGetAllEntityReports();

  const groupedReports = new Map<string, Awaited<ReturnType<typeof dbGetAllEntityReports>>>();
  for (const report of allReports) {
    const key = report.assistantId
      ? `assistant:${report.assistantId}`
      : report.characterId
        ? `character:${report.characterId}`
        : `learningScenario:${report.learningScenarioId}`;

    const reportsForEntity = groupedReports.get(key) ?? [];
    reportsForEntity.push(report);
    groupedReports.set(key, reportsForEntity);
  }

  const overviewItems = await Promise.all(
    Array.from(groupedReports.entries()).map(
      async ([key, reports]): Promise<EntityReportOverview> => {
        const [entityType, entityId] = key.split(':') as [EntityType, string];

        if (!entityId || reports.length === 0) {
          throw new InvalidArgumentError('Invalid report target grouping');
        }

        const latestReportAt = reports.reduce(
          (latest, current) => (current.createdAt > latest ? current.createdAt : latest),
          reports[0]!.createdAt,
        );
        const reasons = [...new Set(reports.map((report) => report.reason))];

        if (entityType === 'assistant') {
          const assistant = await dbGetAssistantById({ assistantId: entityId });
          return {
            entityType,
            entityId,
            entityName: assistant.name,
            reportCount: reports.length,
            status: assistant.suspended
              ? 'suspended'
              : reports.some((report) => !report.checked)
                ? 'new'
                : 'checked',
            latestReportAt,
            reasons,
          };
        }

        if (entityType === 'character') {
          const character = await dbGetCharacterById({ characterId: entityId });
          if (!character) {
            throw new NotFoundError('Character not found');
          }

          return {
            entityType,
            entityId,
            entityName: character.name,
            reportCount: reports.length,
            status: character.suspended
              ? 'suspended'
              : reports.some((report) => !report.checked)
                ? 'new'
                : 'checked',
            latestReportAt,
            reasons,
          };
        }

        const learningScenario = await dbGetLearningScenarioById({
          learningScenarioId: entityId,
        });
        if (!learningScenario) {
          throw new NotFoundError('Learning scenario not found');
        }

        return {
          entityType,
          entityId,
          entityName: learningScenario.name,
          reportCount: reports.length,
          status: learningScenario.suspended
            ? 'suspended'
            : reports.some((report) => !report.checked)
              ? 'new'
              : 'checked',
          latestReportAt,
          reasons,
        };
      },
    ),
  );

  const sorted = overviewItems.sort(
    (a, b) => b.latestReportAt.getTime() - a.latestReportAt.getTime(),
  );

  if (limit === undefined) {
    return sorted;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new InvalidArgumentError('limit must be a positive integer');
  }

  return sorted.slice(0, limit);
}

export async function getReportsForEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: ReportTargetIds) {
  validateSingleTargetAndUuid({ assistantId, characterId, learningScenarioId });
  return dbGetReportsForEntity({ assistantId, characterId, learningScenarioId });
}
