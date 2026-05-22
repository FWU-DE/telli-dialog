import { desc, eq } from 'drizzle-orm';
import { NotFoundError } from '@shared/error';
import { db } from '..';
import { SuspensionRequestSelectModel, suspensionRequestTable } from '../schema';

type ReportTargetIds = {
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

export async function dbGetSuspensionRequestsForEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: ReportTargetIds): Promise<SuspensionRequestSelectModel[]> {
  const providedTargetIds = [assistantId, characterId, learningScenarioId].filter(
    (id): id is string => id !== undefined,
  );

  if (providedTargetIds.length === 1) {
    if (assistantId) {
      return db
        .select()
        .from(suspensionRequestTable)
        .where(eq(suspensionRequestTable.assistantId, assistantId))
        .orderBy(desc(suspensionRequestTable.createdAt));
    }

    if (characterId) {
      return db
        .select()
        .from(suspensionRequestTable)
        .where(eq(suspensionRequestTable.characterId, characterId))
        .orderBy(desc(suspensionRequestTable.createdAt));
    }

    if (learningScenarioId) {
      return db
        .select()
        .from(suspensionRequestTable)
        .where(eq(suspensionRequestTable.learningScenarioId, learningScenarioId))
        .orderBy(desc(suspensionRequestTable.createdAt));
    }
  }

  throw new Error('Exactly one entity target id is required');
}
