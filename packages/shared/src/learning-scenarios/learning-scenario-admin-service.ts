/**
 * @description Service functions for learning scenarios without authorization checks.
 */
import { dbGetFilesForLearningScenario } from '@shared/db/functions/files';
import { db } from '@shared/db';
import {
  AccessLevel,
  LearningScenarioFileMapping,
  LearningScenarioInsertModel,
  learningScenarioInsertSchema,
  learningScenarioTable,
} from '@shared/db/schema';
import { dbGetLearningScenarioById } from '@shared/db/functions/learning-scenario';
import { NotFoundError } from '@shared/error';
import { generateUUID } from '@shared/utils/uuid';
import { buildLearningScenarioPictureKey } from '@shared/learning-scenarios/learning-scenario-service';
import { copyFileInS3 } from '@shared/s3';
import { duplicateFileWithEmbeddings } from '@shared/files/fileService';
import { and, eq, lt } from 'drizzle-orm';
import { addDays } from '@shared/utils/date';

/**
 * This function creates a duplicate of an existing learning scenario,
 * including copying the avatar picture and all related files.
 */
export async function duplicateLearningScenario({
  accessLevel,
  schoolId,
  userId,
  originalLearningScenarioId,
}: {
  accessLevel: AccessLevel | undefined;
  originalLearningScenarioId: string;
  schoolId: string;
  userId: string;
}) {
  const existingLearningScenario = await dbGetLearningScenarioById({
    learningScenarioId: originalLearningScenarioId,
  });
  if (!existingLearningScenario) {
    throw new NotFoundError('Learning scenario not found');
  }

  const learningScenarioId = generateUUID();

  const avatarPictureUrl = await copyAvatarPictureIfExists(
    existingLearningScenario.pictureId,
    learningScenarioId,
  );

  // removes createdAt field and other unexpected fields
  const expectedValues = learningScenarioInsertSchema.parse(existingLearningScenario);

  const copy: LearningScenarioInsertModel = {
    ...expectedValues,
    accessLevel: accessLevel ?? 'private',
    hasLinkAccess: false,
    id: learningScenarioId,
    isDeleted: false,
    originalLearningScenarioId,
    pictureId: avatarPictureUrl,
    schoolId,
    userId,
  };

  const [insertedLearningScenario] = await db
    .insert(learningScenarioTable)
    .values(copy)
    .returning();

  if (!insertedLearningScenario) {
    throw new Error('Could not duplicate learning scenario');
  }

  await copyRelatedFiles(originalLearningScenarioId, learningScenarioId);

  return insertedLearningScenario;
}

async function copyAvatarPictureIfExists(
  sourcePictureId: string | null | undefined,
  newLearningScenarioId: string,
) {
  if (!sourcePictureId) return undefined;

  const newAvatarPictureId = buildLearningScenarioPictureKey(newLearningScenarioId);
  await copyFileInS3({
    copySource: sourcePictureId,
    newKey: newAvatarPictureId,
  });
  return newAvatarPictureId;
}

async function copyRelatedFiles(sourceId: string, destinationId: string) {
  const relatedFiles = await dbGetFilesForLearningScenario(sourceId);
  await Promise.all(
    relatedFiles.map(async (file) => {
      const newFileId = await duplicateFileWithEmbeddings(file.id);
      await db.insert(LearningScenarioFileMapping).values({
        fileId: newFileId,
        learningScenarioId: destinationId,
      });
    }),
  );
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
