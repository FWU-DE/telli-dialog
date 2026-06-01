import { desc, eq } from 'drizzle-orm';
import { InvalidArgumentError, NotFoundError } from '@shared/error';
import { db } from '..';
import { SuspensionRequestSelectModel, suspensionRequestTable } from '../schema';

export type SuspensionRequestEntityType = 'assistant' | 'character' | 'learningScenario';

export type SuspensionRequestEntityRef = {
  entityType: SuspensionRequestEntityType;
  entityId: string;
};

type SuspensionRequestTargetIdsInput = {
  assistantId?: string;
  characterId?: string;
  learningScenarioId?: string;
};

export async function dbCreateSuspensionRequest({
  suspensionRequest,
}: {
  suspensionRequest: typeof suspensionRequestTable.$inferInsert;
}): Promise<SuspensionRequestSelectModel> {
  const [createdSuspensionRequest] = await db
    .insert(suspensionRequestTable)
    .values(suspensionRequest)
    .returning();

  if (!createdSuspensionRequest) {
    throw new Error('Could not create suspension request');
  }

  return createdSuspensionRequest;
}

export async function dbGetSuspensionRequestById({
  suspensionRequestId,
}: {
  suspensionRequestId: string;
}): Promise<SuspensionRequestSelectModel | undefined> {
  const [suspensionRequest] = await db
    .select()
    .from(suspensionRequestTable)
    .where(eq(suspensionRequestTable.id, suspensionRequestId));

  return suspensionRequest;
}

export async function dbMarkSuspensionRequestAsChecked({
  suspensionRequestId,
}: {
  suspensionRequestId: string;
}): Promise<SuspensionRequestSelectModel> {
  const [updatedSuspensionRequest] = await db
    .update(suspensionRequestTable)
    .set({ checked: true })
    .where(eq(suspensionRequestTable.id, suspensionRequestId))
    .returning();

  if (!updatedSuspensionRequest) {
    throw new NotFoundError('Suspension request not found');
  }

  return updatedSuspensionRequest;
}

export async function dbGetPendingSuspensionRequests({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}): Promise<SuspensionRequestSelectModel[]> {
  return db
    .select()
    .from(suspensionRequestTable)
    .where(eq(suspensionRequestTable.checked, false))
    .orderBy(desc(suspensionRequestTable.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function dbGetAllSuspensionRequests(): Promise<SuspensionRequestSelectModel[]> {
  return db.select().from(suspensionRequestTable).orderBy(desc(suspensionRequestTable.createdAt));
}

export async function dbGetSuspensionRequestsByEntityRef({
  entityType,
  entityId,
}: SuspensionRequestEntityRef): Promise<SuspensionRequestSelectModel[]> {
  if (entityType === 'assistant') {
    return db
      .select()
      .from(suspensionRequestTable)
      .where(eq(suspensionRequestTable.assistantId, entityId))
      .orderBy(desc(suspensionRequestTable.createdAt));
  }

  if (entityType === 'character') {
    return db
      .select()
      .from(suspensionRequestTable)
      .where(eq(suspensionRequestTable.characterId, entityId))
      .orderBy(desc(suspensionRequestTable.createdAt));
  }

  return db
    .select()
    .from(suspensionRequestTable)
    .where(eq(suspensionRequestTable.learningScenarioId, entityId))
    .orderBy(desc(suspensionRequestTable.createdAt));
}

export async function dbGetSuspensionRequestsForEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: SuspensionRequestTargetIdsInput): Promise<SuspensionRequestSelectModel[]> {
  const providedTargetIds = [assistantId, characterId, learningScenarioId].filter(
    (id): id is string => id !== undefined,
  );

  if (providedTargetIds.length === 1) {
    if (assistantId) {
      return dbGetSuspensionRequestsByEntityRef({ entityType: 'assistant', entityId: assistantId });
    }

    if (characterId) {
      return dbGetSuspensionRequestsByEntityRef({ entityType: 'character', entityId: characterId });
    }

    if (learningScenarioId) {
      return dbGetSuspensionRequestsByEntityRef({
        entityType: 'learningScenario',
        entityId: learningScenarioId,
      });
    }
  }

  throw new InvalidArgumentError('Exactly one target entity id must be provided');
}
