import { desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { NotFoundError } from '@shared/error';
import { EntityRef, EntityType } from '@shared/entities/entity-types';
import { db } from '..';
import {
  assistantTable,
  characterTable,
  learningScenarioTable,
  SuspensionRequestSelectModel,
  suspensionRequestTable,
} from '../schema';

type SuspensionRequestWithEntityDetails = SuspensionRequestSelectModel & {
  entityType: EntityType;
  entityId: string;
  entityName: string | null;
  suspended: boolean | null;
};

function baseSuspensionRequestsWithEntityDetailsQuery() {
  return db
    .select({
      ...getTableColumns(suspensionRequestTable),
      entityType: sql<EntityType>`
        CASE
          WHEN ${suspensionRequestTable.assistantId} IS NOT NULL THEN 'assistant'
          WHEN ${suspensionRequestTable.characterId} IS NOT NULL THEN 'character'
          ELSE 'learningScenario'
        END
      `,
      entityId: sql<string>`
        COALESCE(
          ${suspensionRequestTable.assistantId},
          ${suspensionRequestTable.characterId},
          ${suspensionRequestTable.learningScenarioId}
        )
      `,
      entityName: sql<string | null>`
        CASE
          WHEN ${suspensionRequestTable.assistantId} IS NOT NULL THEN ${assistantTable.name}
          WHEN ${suspensionRequestTable.characterId} IS NOT NULL THEN ${characterTable.name}
          ELSE ${learningScenarioTable.name}
        END
      `,
      suspended: sql<boolean | null>`
        CASE
          WHEN ${suspensionRequestTable.assistantId} IS NOT NULL THEN ${assistantTable.suspended}
          WHEN ${suspensionRequestTable.characterId} IS NOT NULL THEN ${characterTable.suspended}
          ELSE ${learningScenarioTable.suspended}
        END
      `,
    })
    .from(suspensionRequestTable)
    .leftJoin(assistantTable, eq(suspensionRequestTable.assistantId, assistantTable.id))
    .leftJoin(characterTable, eq(suspensionRequestTable.characterId, characterTable.id))
    .leftJoin(
      learningScenarioTable,
      eq(suspensionRequestTable.learningScenarioId, learningScenarioTable.id),
    );
}

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

export async function dbGetAllSuspensionRequestsWithEntityDetails(): Promise<
  SuspensionRequestWithEntityDetails[]
> {
  return baseSuspensionRequestsWithEntityDetailsQuery().orderBy(
    desc(suspensionRequestTable.createdAt),
  );
}

export async function dbGetSuspensionRequestsByEntityRef({
  entityType,
  entityId,
}: EntityRef): Promise<SuspensionRequestSelectModel[]> {
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

export async function dbGetSuspensionRequestsByEntityRefWithEntityDetails({
  entityType,
  entityId,
}: EntityRef): Promise<SuspensionRequestWithEntityDetails[]> {
  if (entityType === 'assistant') {
    return baseSuspensionRequestsWithEntityDetailsQuery()
      .where(eq(suspensionRequestTable.assistantId, entityId))
      .orderBy(desc(suspensionRequestTable.createdAt));
  }

  if (entityType === 'character') {
    return baseSuspensionRequestsWithEntityDetailsQuery()
      .where(eq(suspensionRequestTable.characterId, entityId))
      .orderBy(desc(suspensionRequestTable.createdAt));
  }

  return baseSuspensionRequestsWithEntityDetailsQuery()
    .where(eq(suspensionRequestTable.learningScenarioId, entityId))
    .orderBy(desc(suspensionRequestTable.createdAt));
}
