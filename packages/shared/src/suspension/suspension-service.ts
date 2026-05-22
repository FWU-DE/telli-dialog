import { z } from 'zod';
import { verifyReadAccess } from '@shared/auth/authorization-service';
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
  dbCreateSuspensionRequest,
  dbGetAllSuspensionRequests,
  dbGetSuspensionRequestsForEntity,
  dbMarkSuspensionRequestAsChecked,
} from '@shared/db/functions/suspension-requests';
import { dbGetUserById } from '@shared/db/functions/user';
import { SuspensionRequestReason, suspensionRequestReasonSchema } from '@shared/db/schema';
import { InvalidArgumentError, NotFoundError, checkParameterUUID } from '@shared/error';

const suspensionRequestDescriptionSchema = z.string().min(1).max(500);

type SuspensionRequestTargetIds = {
  assistantId?: string;
  characterId?: string;
  learningScenarioId?: string;
};

type EntityType = 'assistant' | 'character' | 'learningScenario';

type SuspensionRequestOverviewStatus = 'new' | 'suspended' | 'checked';

export type SuspensionRequestOverview = {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  requestCount: number;
  status: SuspensionRequestOverviewStatus;
  latestRequestAt: Date;
  reasons: SuspensionRequestReason[];
};

function validateSingleTargetAndUuid({
  assistantId,
  characterId,
  learningScenarioId,
}: SuspensionRequestTargetIds) {
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
}: SuspensionRequestTargetIds) {
  if (assistantId) {
    return dbGetAssistantById({ assistantId });
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

export async function createSuspensionRequest({
  assistantId,
  characterId,
  learningScenarioId,
  requesterId,
  reason,
  description,
}: SuspensionRequestTargetIds & {
  requesterId: string;
  reason: string;
  description: string;
}) {
  validateSingleTargetAndUuid({ assistantId, characterId, learningScenarioId });
  checkParameterUUID(requesterId);

  const validatedReason = suspensionRequestReasonSchema.parse(reason);
  const validatedDescription = suspensionRequestDescriptionSchema.parse(description);

  const requester = await dbGetUserById({ userId: requesterId });
  if (!requester) {
    throw new NotFoundError('Requester not found');
  }

  const targetEntity = await resolveTargetEntity({ assistantId, characterId, learningScenarioId });
  verifyReadAccess({
    item: targetEntity,
    user: requester,
  });

  return dbCreateSuspensionRequest({
    suspensionRequest: {
      assistantId,
      characterId,
      learningScenarioId,
      requesterId,
      reason: validatedReason,
      description: validatedDescription,
    },
  });
}

export async function markSuspensionRequestAsChecked(suspensionRequestId: string) {
  checkParameterUUID(suspensionRequestId);
  return dbMarkSuspensionRequestAsChecked({ suspensionRequestId });
}

export async function suspendEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: SuspensionRequestTargetIds) {
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
}: SuspensionRequestTargetIds) {
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

export async function getSuspensionRequestOverviews({
  limit,
}: {
  limit?: number;
} = {}): Promise<SuspensionRequestOverview[]> {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new InvalidArgumentError('limit must be a positive integer');
  }

  const allSuspensionRequests = await dbGetAllSuspensionRequests();

  const groupedSuspensionRequests = new Map<
    string,
    Awaited<ReturnType<typeof dbGetAllSuspensionRequests>>
  >();
  for (const suspensionRequest of allSuspensionRequests) {
    const key = suspensionRequest.assistantId
      ? `assistant:${suspensionRequest.assistantId}`
      : suspensionRequest.characterId
        ? `character:${suspensionRequest.characterId}`
        : `learningScenario:${suspensionRequest.learningScenarioId}`;

    const suspensionRequestsForEntity = groupedSuspensionRequests.get(key) ?? [];
    suspensionRequestsForEntity.push(suspensionRequest);
    groupedSuspensionRequests.set(key, suspensionRequestsForEntity);
  }

  const assistantIds = new Set<string>();
  const characterIds = new Set<string>();
  const learningScenarioIds = new Set<string>();

  for (const key of groupedSuspensionRequests.keys()) {
    const [entityType, entityId] = key.split(':') as [EntityType, string];

    if (!entityId) {
      throw new InvalidArgumentError('Invalid suspension request target grouping');
    }

    if (entityType === 'assistant') {
      assistantIds.add(entityId);
      continue;
    }

    if (entityType === 'character') {
      characterIds.add(entityId);
      continue;
    }

    learningScenarioIds.add(entityId);
  }

  const [assistants, characters, learningScenarios] = await Promise.all([
    dbGetAssistantsByIds({ assistantIds: [...assistantIds] }),
    dbGetCharactersByIds({ characterIds: [...characterIds] }),
    dbGetLearningScenariosByIds({ learningScenarioIds: [...learningScenarioIds] }),
  ]);

  const assistantsById = new Map(assistants.map((assistant) => [assistant.id, assistant]));
  const charactersById = new Map(characters.map((character) => [character.id, character]));
  const learningScenariosById = new Map(
    learningScenarios.map((learningScenario) => [learningScenario.id, learningScenario]),
  );

  const overviewItems = await Promise.all(
    Array.from(groupedSuspensionRequests.entries()).map(
      async ([key, suspensionRequests]): Promise<SuspensionRequestOverview> => {
        const [entityType, entityId] = key.split(':') as [EntityType, string];

        if (!entityId || suspensionRequests.length === 0) {
          throw new InvalidArgumentError('Invalid suspension request target grouping');
        }

        const latestRequestAt = suspensionRequests.reduce(
          (latest, current) => (current.createdAt > latest ? current.createdAt : latest),
          suspensionRequests[0]!.createdAt,
        );
        const reasons = [
          ...new Set(suspensionRequests.map((suspensionRequest) => suspensionRequest.reason)),
        ];

        if (entityType === 'assistant') {
          const assistant = assistantsById.get(entityId);
          if (!assistant) {
            throw new NotFoundError('Assistant not found');
          }

          return {
            entityType,
            entityId,
            entityName: assistant.name,
            requestCount: suspensionRequests.length,
            status: assistant.suspended
              ? 'suspended'
              : suspensionRequests.some((suspensionRequest) => !suspensionRequest.checked)
                ? 'new'
                : 'checked',
            latestRequestAt,
            reasons,
          };
        }

        if (entityType === 'character') {
          const character = charactersById.get(entityId);
          if (!character) {
            throw new NotFoundError('Character not found');
          }

          return {
            entityType,
            entityId,
            entityName: character.name,
            requestCount: suspensionRequests.length,
            status: character.suspended
              ? 'suspended'
              : suspensionRequests.some((suspensionRequest) => !suspensionRequest.checked)
                ? 'new'
                : 'checked',
            latestRequestAt,
            reasons,
          };
        }

        const learningScenario = learningScenariosById.get(entityId);
        if (!learningScenario) {
          throw new NotFoundError('Learning scenario not found');
        }

        return {
          entityType,
          entityId,
          entityName: learningScenario.name,
          requestCount: suspensionRequests.length,
          status: learningScenario.suspended
            ? 'suspended'
            : suspensionRequests.some((suspensionRequest) => !suspensionRequest.checked)
              ? 'new'
              : 'checked',
          latestRequestAt,
          reasons,
        };
      },
    ),
  );

  const sorted = overviewItems.sort(
    (a, b) => b.latestRequestAt.getTime() - a.latestRequestAt.getTime(),
  );

  if (limit === undefined) {
    return sorted;
  }

  return sorted.slice(0, limit);
}

export async function getSuspensionRequestsForEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: SuspensionRequestTargetIds) {
  validateSingleTargetAndUuid({ assistantId, characterId, learningScenarioId });
  return dbGetSuspensionRequestsForEntity({ assistantId, characterId, learningScenarioId });
}
