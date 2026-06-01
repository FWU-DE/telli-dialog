import { desc, eq } from 'drizzle-orm';
import { NotFoundError } from '@shared/error';
import { EntityRef, EntityType } from '@shared/entities/entity-types';
import { db } from '..';
import { SuspensionRequestSelectModel, suspensionRequestTable } from '../schema';

export type SuspensionRequestEntityType = EntityType;

export type SuspensionRequestEntityRef = EntityRef;

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
  entityType,
  entityId,
}: SuspensionRequestEntityRef): Promise<SuspensionRequestSelectModel[]> {
  return dbGetSuspensionRequestsByEntityRef({ entityType, entityId });
}
