import { z } from 'zod';
import { verifyReadAccess } from '@shared/auth/authorization-service';
import {
  dbGetAssistantById,
  dbGetAssistantsByIds,
  dbLiftSuspensionOnAssistant,
  dbSetAssistantSuspended,
} from '@shared/db/functions/assistants';
import {
  dbGetCharacterById,
  dbGetCharactersByIds,
  dbLiftSuspensionOnCharacter,
  dbSetCharacterSuspended,
} from '@shared/db/functions/character';
import {
  dbGetLearningScenarioById,
  dbGetLearningScenariosByIds,
  dbLiftSuspensionOnLearningScenario,
  dbSetLearningScenarioSuspended,
} from '@shared/db/functions/learning-scenario';
import {
  dbCreateSuspensionRequest,
  dbGetAllSuspensionRequests,
  dbGetSuspensionRequestsByEntityRef,
  dbMarkSuspensionRequestAsChecked,
} from '@shared/db/functions/suspension-requests';
import { dbGetUserById } from '@shared/db/functions/user';
import {
  SuspensionRequestReason,
  suspensionRequestReasonSchema,
  SuspensionRequestSelectModel,
} from '@shared/db/schema';
import { InvalidArgumentError, NotFoundError, checkParameterUUID } from '@shared/error';

const suspensionRequestDescriptionSchema = z.string().min(1).max(500);
const EXACTLY_ONE_TARGET_ENTITY_ID_ERROR = 'Exactly one target entity id must be provided';

export type SuspensionRequestTargetIds = {
  assistantId?: string;
  characterId?: string;
  learningScenarioId?: string;
};

export type EntityType = 'assistant' | 'character' | 'learningScenario';

export type SuspensionEntityRef = {
  entityType: EntityType;
  entityId: string;
};

type ReportedEntityOverviewStatus = 'new' | 'suspended' | 'checked';

export type ReportedEntityOverview = {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  requestCount: number;
  status: ReportedEntityOverviewStatus;
  latestRequestAt: Date;
  reasons: { id: string; reason: SuspensionRequestReason }[];
};

/**
 * @deprecated Use ReportedEntityOverview instead.
 */
export type SuspensionRequestOverview = ReportedEntityOverview;

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
  ReportedEntityOverview,
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
    throw new InvalidArgumentError(EXACTLY_ONE_TARGET_ENTITY_ID_ERROR);
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

  throw new InvalidArgumentError(EXACTLY_ONE_TARGET_ENTITY_ID_ERROR);
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

export async function suspendEntity(
  entityRefOrTargetIds: SuspensionEntityRef | SuspensionRequestTargetIds,
) {
  const { entityType, entityId } = normalizeSuspensionEntityRef(entityRefOrTargetIds);

  if (entityType === 'assistant') {
    return dbSetAssistantSuspended({ assistantId: entityId });
  }

  if (entityType === 'character') {
    return dbSetCharacterSuspended({ characterId: entityId });
  }

  if (entityType === 'learningScenario') {
    return dbSetLearningScenarioSuspended({ learningScenarioId: entityId });
  }

  throw new InvalidArgumentError(EXACTLY_ONE_TARGET_ENTITY_ID_ERROR);
}

export async function liftSuspensionOnEntity(
  entityRefOrTargetIds: SuspensionEntityRef | SuspensionRequestTargetIds,
) {
  const { entityType, entityId } = normalizeSuspensionEntityRef(entityRefOrTargetIds);

  if (entityType === 'assistant') {
    return dbLiftSuspensionOnAssistant({ assistantId: entityId });
  }

  if (entityType === 'character') {
    return dbLiftSuspensionOnCharacter({ characterId: entityId });
  }

  if (entityType === 'learningScenario') {
    return dbLiftSuspensionOnLearningScenario({ learningScenarioId: entityId });
  }

  throw new InvalidArgumentError(EXACTLY_ONE_TARGET_ENTITY_ID_ERROR);
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
    reasons: suspensionRequests.map((suspensionRequest) => ({
      id: suspensionRequest.id,
      reason: suspensionRequest.reason,
    })),

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

function buildReportedEntityOverview(
  groupedSuspensionRequest: SuspensionRequestGroup,
  entityLookup: SuspensionRequestEntityLookup,
): ReportedEntityOverview {
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

export async function getSuspensionRequestOverviews(): Promise<ReportedEntityOverview[]> {
  const allSuspensionRequests = await dbGetAllSuspensionRequests();

  const groupedSuspensionRequests = groupSuspensionRequestsByEntity(allSuspensionRequests);
  const groupedEntityIds = collectSuspensionRequestEntityIds(groupedSuspensionRequests);
  const entityLookup = await loadSuspensionRequestEntityLookup(groupedEntityIds);

  const overviewItems = groupedSuspensionRequests.map((groupedSuspensionRequest) =>
    buildReportedEntityOverview(groupedSuspensionRequest, entityLookup),
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
}: SuspensionRequestTargetIds): Promise<SuspensionRequestSelectModel[]> {
  const entityRef = normalizeSuspensionEntityRef({ assistantId, characterId, learningScenarioId });
  return dbGetSuspensionRequestsByEntityRef(entityRef);
}

/**
 * Retrieves a reported entity together with all related suspension requests.
 * The entity is identified by the combination of entity type and entity id.
 * This is used to display the detailed view in the admin interface.
 * @param entityType The type of the entity (assistant, character, or learning scenario)
 * @param entityId The id of the entity
 * @returns The detailed reported entity overview and related suspension requests
 */
export async function getSuspendedItemWithDetails({
  entityType,
  entityId,
}: SuspensionEntityRef): Promise<{
  suspendedItem: ReportedEntityOverview;
  requests: SuspensionRequestSelectModel[];
}> {
  checkParameterUUID(entityId);

  const entityRef = { entityType, entityId };
  const entityIds = convertSuspensionEntityRefToEntityIds(entityRef);
  const entityLookup = await loadSuspensionRequestEntityLookup(entityIds);
  const suspensionRequest = await dbGetSuspensionRequestsByEntityRef(entityRef);
  const groupedSuspensionRequests = groupSuspensionRequestsByEntity([...suspensionRequest]);

  const overviewItem = groupedSuspensionRequests.map((groupedSuspensionRequest) =>
    buildReportedEntityOverview(groupedSuspensionRequest, entityLookup),
  )[0];

  if (!overviewItem)
    throw new NotFoundError('Suspension request overview not found for the given entity');

  return { suspendedItem: overviewItem, requests: suspensionRequest };
}

function convertSuspensionEntityRefToEntityIds({
  entityType,
  entityId,
}: SuspensionEntityRef): SuspensionRequestEntityIds {
  return {
    assistantIds: entityType === 'assistant' ? [entityId] : [],
    characterIds: entityType === 'character' ? [entityId] : [],
    learningScenarioIds: entityType === 'learningScenario' ? [entityId] : [],
  };
}

function normalizeSuspensionEntityRef(
  entityRefOrTargetIds: SuspensionEntityRef | SuspensionRequestTargetIds,
): SuspensionEntityRef {
  if ('entityType' in entityRefOrTargetIds) {
    checkParameterUUID(entityRefOrTargetIds.entityId);
    return entityRefOrTargetIds;
  }

  validateSingleTargetAndUuid(entityRefOrTargetIds);

  if (entityRefOrTargetIds.assistantId) {
    return {
      entityType: 'assistant',
      entityId: entityRefOrTargetIds.assistantId,
    };
  }

  if (entityRefOrTargetIds.characterId) {
    return {
      entityType: 'character',
      entityId: entityRefOrTargetIds.characterId,
    };
  }

  if (entityRefOrTargetIds.learningScenarioId) {
    return {
      entityType: 'learningScenario',
      entityId: entityRefOrTargetIds.learningScenarioId,
    };
  }

  throw new InvalidArgumentError(EXACTLY_ONE_TARGET_ENTITY_ID_ERROR);
}
