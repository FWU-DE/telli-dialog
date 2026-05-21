import { desc, eq } from 'drizzle-orm';
import { NotFoundError } from '@shared/error';
import { db } from '..';
import { EntityReportSelectModel, entityReportTable } from '../schema';

type ReportTargetIds = {
  assistantId?: string;
  characterId?: string;
  learningScenarioId?: string;
};

export async function dbCreateEntityReport({
  report,
}: {
  report: typeof entityReportTable.$inferInsert;
}): Promise<EntityReportSelectModel> {
  const [createdReport] = await db.insert(entityReportTable).values(report).returning();

  if (!createdReport) {
    throw new Error('Could not create entity report');
  }

  return createdReport;
}

export async function dbGetEntityReportById({
  reportId,
}: {
  reportId: string;
}): Promise<EntityReportSelectModel | undefined> {
  const [report] = await db
    .select()
    .from(entityReportTable)
    .where(eq(entityReportTable.id, reportId));

  return report;
}

export async function dbMarkEntityReportAsChecked({
  reportId,
}: {
  reportId: string;
}): Promise<EntityReportSelectModel> {
  const [updatedReport] = await db
    .update(entityReportTable)
    .set({ checked: true })
    .where(eq(entityReportTable.id, reportId))
    .returning();

  if (!updatedReport) {
    throw new NotFoundError('Report not found');
  }

  return updatedReport;
}

export async function dbGetPendingEntityReports({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}): Promise<EntityReportSelectModel[]> {
  return db
    .select()
    .from(entityReportTable)
    .where(eq(entityReportTable.checked, false))
    .orderBy(desc(entityReportTable.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function dbGetAllEntityReports(): Promise<EntityReportSelectModel[]> {
  return db.select().from(entityReportTable).orderBy(desc(entityReportTable.createdAt));
}

export async function dbGetReportsForEntity({
  assistantId,
  characterId,
  learningScenarioId,
}: ReportTargetIds): Promise<EntityReportSelectModel[]> {
  const providedTargetIds = [assistantId, characterId, learningScenarioId].filter(
    (id): id is string => id !== undefined,
  );

  if (providedTargetIds.length === 1) {
    if (assistantId) {
      return db
        .select()
        .from(entityReportTable)
        .where(eq(entityReportTable.assistantId, assistantId))
        .orderBy(desc(entityReportTable.createdAt));
    }

    if (characterId) {
      return db
        .select()
        .from(entityReportTable)
        .where(eq(entityReportTable.characterId, characterId))
        .orderBy(desc(entityReportTable.createdAt));
    }

    if (learningScenarioId) {
      return db
        .select()
        .from(entityReportTable)
        .where(eq(entityReportTable.learningScenarioId, learningScenarioId))
        .orderBy(desc(entityReportTable.createdAt));
    }
  }

  throw new Error('Exactly one entity target id is required');
}
