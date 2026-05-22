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

type SuspensionRequest = Awaited<ReturnType<typeof dbGetAllSuspensionRequests>>[number];

type SuspensionRequestGroup = {
  entityType: EntityType;
  entityId: string;
  suspensionRequests: SuspensionRequest[];
};

type SuspensionRequestEntityIds = {
  assistantIds: string[];
  characterIds: string[];
  learningScenarioIds: string[];
};

type SuspensionRequestEntitySummary = {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  suspended: boolean;
};

type SuspensionRequestEntityLookup = {
  assistantsById: Map<string, SuspensionRequestEntitySummary>;
  charactersById: Map<string, SuspensionRequestEntitySummary>;
  learningScenariosById: Map<string, SuspensionRequestEntitySummary>;
};

type SuspensionRequestAggregate = Pick<
  SuspensionRequestOverview,
  'requestCount' | 'latestRequestAt' | 'reasons'
> & {
  hasUncheckedRequests: boolean;
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
  return setEntitySuspensionState({
    assistantId,
    characterId,
    learningScenarioId,
    suspended: true,
  });
}

export async function liftSuspensionOnEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: SuspensionRequestTargetIds) {
  return setEntitySuspensionState({
    assistantId,
    characterId,
    learningScenarioId,
    suspended: false,
  });
}

// internal helper for deduplication - use suspendEntity and liftSuspensionOnEntity for clarity of intent
async function setEntitySuspensionState({
  assistantId,
  characterId,
  learningScenarioId,
  suspended,
}: SuspensionRequestTargetIds & { suspended: boolean }) {
  validateSingleTargetAndUuid({ assistantId, characterId, learningScenarioId });

  if (assistantId) {
    return dbSetAssistantSuspended({ assistantId, suspended });
  }

  if (characterId) {
    return dbSetCharacterSuspended({ characterId, suspended });
  }

  if (learningScenarioId) {
    return dbSetLearningScenarioSuspended({ learningScenarioId, suspended });
  }

  throw new InvalidArgumentError('Exactly one target entity id must be provided');
}

function getSuspensionRequestTarget(
  suspensionRequest: SuspensionRequest,
): Pick<SuspensionRequestGroup, 'entityType' | 'entityId'> {
  if (suspensionRequest.assistantId) {
    return {
      entityType: 'assistant',
      entityId: suspensionRequest.assistantId,
    };
  }

  if (suspensionRequest.characterId) {
    return {
      entityType: 'character',
      entityId: suspensionRequest.characterId,
    };
  }

  if (suspensionRequest.learningScenarioId) {
    return {
      entityType: 'learningScenario',
      entityId: suspensionRequest.learningScenarioId,
    };
  }

  throw new InvalidArgumentError('Invalid suspension request target grouping');
}

function groupSuspensionRequestsByEntity(
  suspensionRequests: SuspensionRequest[],
): SuspensionRequestGroup[] {
  const groupedSuspensionRequests = {
    assistant: new Map<string, SuspensionRequest[]>(),
    character: new Map<string, SuspensionRequest[]>(),
    learningScenario: new Map<string, SuspensionRequest[]>(),
  } satisfies Record<EntityType, Map<string, SuspensionRequest[]>>;

  for (const suspensionRequest of suspensionRequests) {
    const { entityType, entityId } = getSuspensionRequestTarget(suspensionRequest);
    const suspensionRequestsForEntity = groupedSuspensionRequests[entityType].get(entityId) ?? [];

    suspensionRequestsForEntity.push(suspensionRequest);
    groupedSuspensionRequests[entityType].set(entityId, suspensionRequestsForEntity);
  }

  return Object.entries(groupedSuspensionRequests).flatMap(([entityType, requestsById]) =>
    Array.from(requestsById.entries()).map(([entityId, groupedRequests]) => ({
      entityType: entityType as EntityType,
      entityId,
      suspensionRequests: groupedRequests,
    })),
  );
}

function collectSuspensionRequestEntityIds(
  groupedSuspensionRequests: SuspensionRequestGroup[],
): SuspensionRequestEntityIds {
  const assistantIds = new Set<string>();
  const characterIds = new Set<string>();
  const learningScenarioIds = new Set<string>();

  for (const { entityType, entityId } of groupedSuspensionRequests) {
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

  return {
    assistantIds: [...assistantIds],
    characterIds: [...characterIds],
    learningScenarioIds: [...learningScenarioIds],
  };
}

async function loadSuspensionRequestEntityLookup({
  assistantIds,
  characterIds,
  learningScenarioIds,
}: SuspensionRequestEntityIds): Promise<SuspensionRequestEntityLookup> {
  const [assistants, characters, learningScenarios] = await Promise.all([
    dbGetAssistantsByIds({ assistantIds }),
    dbGetCharactersByIds({ characterIds }),
    dbGetLearningScenariosByIds({ learningScenarioIds }),
  ]);

  return {
    assistantsById: new Map(
      assistants.map((assistant) => [
        assistant.id,
        {
          entityType: 'assistant' as const,
          entityId: assistant.id,
          entityName: assistant.name,
          suspended: assistant.suspended,
        },
      ]),
    ),
    charactersById: new Map(
      characters.map((character) => [
        character.id,
        {
          entityType: 'character' as const,
          entityId: character.id,
          entityName: character.name,
          suspended: character.suspended,
        },
      ]),
    ),
    learningScenariosById: new Map(
      learningScenarios.map((learningScenario) => [
        learningScenario.id,
        {
          entityType: 'learningScenario' as const,
          entityId: learningScenario.id,
          entityName: learningScenario.name,
          suspended: learningScenario.suspended,
        },
      ]),
    ),
  };
}

function getSuspensionRequestAggregate(
  suspensionRequests: SuspensionRequest[],
): SuspensionRequestAggregate {
  if (suspensionRequests.length === 0) {
    throw new InvalidArgumentError('Invalid suspension request target grouping');
  }

  return {
    requestCount: suspensionRequests.length,
    latestRequestAt: suspensionRequests.reduce(
      (latest, current) => (current.createdAt > latest ? current.createdAt : latest),
      suspensionRequests[0]!.createdAt,
    ),
    reasons: [...new Set(suspensionRequests.map((suspensionRequest) => suspensionRequest.reason))],
    hasUncheckedRequests: suspensionRequests.some(
      (suspensionRequest) => !suspensionRequest.checked,
    ),
  };
}

function getSuspensionRequestEntitySummary(
  groupedSuspensionRequest: SuspensionRequestGroup,
  entityLookup: SuspensionRequestEntityLookup,
): SuspensionRequestEntitySummary {
  if (groupedSuspensionRequest.entityType === 'assistant') {
    const assistant = entityLookup.assistantsById.get(groupedSuspensionRequest.entityId);
    if (!assistant) {
      throw new NotFoundError('Assistant not found');
    }

    return assistant;
  }

  if (groupedSuspensionRequest.entityType === 'character') {
    const character = entityLookup.charactersById.get(groupedSuspensionRequest.entityId);
    if (!character) {
      throw new NotFoundError('Character not found');
    }

    return character;
  }

  const learningScenario = entityLookup.learningScenariosById.get(
    groupedSuspensionRequest.entityId,
  );
  if (!learningScenario) {
    throw new NotFoundError('Learning scenario not found');
  }

  return learningScenario;
}

function buildSuspensionRequestOverview(
  groupedSuspensionRequest: SuspensionRequestGroup,
  entityLookup: SuspensionRequestEntityLookup,
): SuspensionRequestOverview {
  const entity = getSuspensionRequestEntitySummary(groupedSuspensionRequest, entityLookup);
  const aggregate = getSuspensionRequestAggregate(groupedSuspensionRequest.suspensionRequests);

  return {
    entityType: entity.entityType,
    entityId: entity.entityId,
    entityName: entity.entityName,
    requestCount: aggregate.requestCount,
    status: entity.suspended ? 'suspended' : aggregate.hasUncheckedRequests ? 'new' : 'checked',
    latestRequestAt: aggregate.latestRequestAt,
    reasons: aggregate.reasons,
  };
}

export async function getSuspensionRequestOverviews(): Promise<SuspensionRequestOverview[]> {
  const allSuspensionRequests = await dbGetAllSuspensionRequests();

  const groupedSuspensionRequests = groupSuspensionRequestsByEntity(allSuspensionRequests);
  const groupedEntityIds = collectSuspensionRequestEntityIds(groupedSuspensionRequests);
  const entityLookup = await loadSuspensionRequestEntityLookup(groupedEntityIds);

  const overviewItems = groupedSuspensionRequests.map((groupedSuspensionRequest) =>
    buildSuspensionRequestOverview(groupedSuspensionRequest, entityLookup),
  );

  const sorted = overviewItems.sort(
    (a, b) => b.latestRequestAt.getTime() - a.latestRequestAt.getTime(),
  );

  return sorted;
}

export async function getSuspensionRequestsForEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: SuspensionRequestTargetIds) {
  validateSingleTargetAndUuid({ assistantId, characterId, learningScenarioId });
  return dbGetSuspensionRequestsForEntity({ assistantId, characterId, learningScenarioId });
}
