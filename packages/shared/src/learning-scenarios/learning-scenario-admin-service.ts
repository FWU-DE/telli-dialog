/**
 * @description Service functions for learning scenarios without authorization checks.
 */
import { db } from '@shared/db';
import {
  AccessLevel,
  LearningScenarioInsertModel,
  learningScenarioInsertSchema,
  learningScenarioTable,
} from '@shared/db/schema';
import { dbGetLearningScenarioById } from '@shared/db/functions/learning-scenario';
import { NotFoundError } from '@shared/error';
import { generateUUID } from '@shared/utils/uuid';
import { and, eq, lt } from 'drizzle-orm';
import { addDays } from '@shared/utils/date';
import {
  copyEntityPictureIfExists,
  copyRelatedTemplateFiles,
} from '@shared/templates/template-service';
import { buildLearningScenarioPictureKey } from '@shared/utils/picture-key';

/**
 * This function creates a duplicate of an existing learning scenario,
 * including copying the avatar picture and all related files.
 */
export async function duplicateLearningScenario({
  accessLevel,
  userId,
  originalLearningScenarioId,
  duplicateLearningScenarioName,
}: {
  accessLevel: AccessLevel | undefined;
  originalLearningScenarioId: string;
  userId: string;
  duplicateLearningScenarioName?: string;
}) {
  const existingLearningScenario = await dbGetLearningScenarioById({
    learningScenarioId: originalLearningScenarioId,
  });
  if (!existingLearningScenario) {
    throw new NotFoundError('Learning scenario not found');
  }

  const learningScenarioId = generateUUID();

  const avatarPictureUrl = await copyEntityPictureIfExists({
    sourcePictureId: existingLearningScenario.pictureId,
    newEntityId: learningScenarioId,
    buildPictureKey: buildLearningScenarioPictureKey,
  });

  // removes createdAt field and other unexpected fields
  const expectedValues = learningScenarioInsertSchema.parse(existingLearningScenario);

  const copy: LearningScenarioInsertModel = {
    ...expectedValues,
    accessLevel: accessLevel ?? 'private',
    hasLinkAccess: false,
    id: learningScenarioId,
    isDeleted: false,
    name: duplicateLearningScenarioName ?? expectedValues.name,
    originalLearningScenarioId,
    pictureId: avatarPictureUrl,
    userId,
  };

  const [insertedLearningScenario] = await db
    .insert(learningScenarioTable)
    .values(copy)
    .returning();

  if (!insertedLearningScenario) {
    throw new Error('Could not duplicate learning scenario');
  }

  await copyRelatedTemplateFiles(
    'learning-scenario',
    originalLearningScenarioId,
    learningScenarioId,
  );

  return insertedLearningScenario;
}

/**
 * Cleans up learning scenarios with empty names from the database.
 *
 * CAUTION: This is an admin function that does not check any authorization!
 *
 * Note: linked files will be unlinked but removed separately by `dbDeleteDanglingFiles`
 *
 * @returns number of deleted learning scenarios in db.
 */
export async function cleanupLearningScenarios() {
  const result = await db
    .delete(learningScenarioTable)
    .where(
      and(
        eq(learningScenarioTable.name, ''),
        lt(learningScenarioTable.createdAt, addDays(new Date(), -1)),
      ),
    )
    .returning();
  return result.length;
}
