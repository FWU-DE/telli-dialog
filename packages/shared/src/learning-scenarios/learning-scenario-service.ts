import { UserModel } from '@shared/auth/user-model';
import { db } from '@shared/db';
import { dbGetFilesForLearningScenario } from '@shared/db/functions/files';
import {
  dbDeleteLearningScenarioByIdAndUserId,
  dbGetGlobalLearningScenarios,
  dbGetLearningScenarioById,
  dbGetLearningScenarioByIdOptionalShareData,
  dbGetLearningScenarioByIdWithShareData,
  dbGetLearningScenariosBySchoolId,
  dbGetLearningScenariosByUserId,
  dbGetSharedLearningScenarioConversations,
} from '@shared/db/functions/learning-scenario';
import {
  AccessLevel,
  accessLevelSchema,
  FileModel,
  fileTable,
  LearningScenarioFileMapping,
  LearningScenarioInsertModel,
  learningScenarioInsertSchema,
  LearningScenarioOptionalShareDataModel,
  LearningScenarioSelectModel,
  learningScenarioTable,
  learningScenarioUpdateSchema,
  LearningScenarioWithShareDataModel,
  sharedLearningScenarioTable,
} from '@shared/db/schema';
import { checkParameterUUID, ForbiddenError, NotFoundError } from '@shared/error';
import {
  deleteAvatarPicture,
  deleteMessageAttachments,
  duplicateFileWithEmbeddings,
  getAvatarPictureUrl,
} from '@shared/files/fileService';
import { copyFileInS3, getReadOnlySignedUrl, uploadFileToS3 } from '@shared/s3';
import { generateInviteCode } from '@shared/sharing/generate-invite-code';
import { addDays } from '@shared/utils/date';
import { generateUUID } from '@shared/utils/uuid';
import { and, eq, lt } from 'drizzle-orm';
import z from 'zod';

export type LearningScenarioWithImage = LearningScenarioOptionalShareDataModel & {
  maybeSignedPictureUrl: string | undefined;
};

/**
 * Returns all learning scenarios a user can access.
 */
export async function getLearningScenariosForUser({
  userId,
}: {
  userId: string;
}): Promise<LearningScenarioWithImage[]> {
  const learningScenarios = await dbGetLearningScenariosByUserId({ userId });
  // This is part of the old logic, keep it for now
  // If a new learning scenario is created, it has an empty name.
  const filteredScenarios = learningScenarios.filter((c) => c.name !== '');
  const enrichedScenarios = await enrichLearningScenarioWithPictureUrl({
    learningScenarios: filteredScenarios,
  });
  return enrichedScenarios;
}

/**
 * Returns the list of available learning scenarios that the user can access
 * based on userId, schoolId, federalStateId, and access level.
 */
export async function getLearningScenariosByAccessLevel({
  accessLevel,
  schoolId,
  userId,
  federalStateId,
}: {
  accessLevel: AccessLevel;
  schoolId: string;
  userId: string;
  federalStateId: string;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  if (accessLevel === 'global') {
    return dbGetGlobalLearningScenarios({ userId, federalStateId });
  } else if (accessLevel === 'school') {
    return dbGetLearningScenariosBySchoolId({ schoolId, userId });
  } else if (accessLevel === 'private') {
    return dbGetLearningScenariosByUserId({ userId });
  }
  return [];
}

/**
 * Loads a learning scenario from db
 * @returns
 * - isOwner: whether the user is the owner
 * - isPrivate: whether the learning scenario is private
 * - the learning scenario itself
 * @throws NotFoundError if learning scenario does not exist
 */
export async function getLearningScenarioInfo(
  learningScenarioId: string,
  userId: string,
): Promise<{
  isOwner: boolean;
  isPrivate: boolean;
  learningScenario: LearningScenarioSelectModel;
}> {
  const learningScenario = await dbGetLearningScenarioById({ learningScenarioId });
  if (!learningScenario) throw new NotFoundError('Learning scenario not found');

  return {
    isOwner: learningScenario.userId === userId,
    isPrivate: learningScenario.accessLevel === 'private',
    learningScenario,
  };
}

/**
 * Returns a learning scenario with invite code and other sharing related data for sharing page.
 * @throws NotFoundError if learning scenario does not exist or is not shared
 */
export async function getSharedLearningScenario({
  learningScenarioId,
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}): Promise<LearningScenarioWithShareDataModel> {
  checkParameterUUID(learningScenarioId);
  const learningScenario = await dbGetLearningScenarioByIdWithShareData({
    learningScenarioId,
    userId,
  });
  if (!learningScenario || !learningScenario.inviteCode) {
    throw new NotFoundError('Learning scenario not found');
  }

  return learningScenario;
}

/**
 * User updates a learning scenario.
 * @throws ZodError if the data is invalid.
 * @throws ForbiddenError if the user is not the owner of the learning scenario.
 */
export async function updateLearningScenario({
  learningScenarioId,
  user,
  data,
}: {
  learningScenarioId: string;
  user: UserModel;
  data: LearningScenarioSelectModel;
}) {
  checkParameterUUID(learningScenarioId);
  // Authorization check
  const { isOwner } = await getLearningScenarioInfo(learningScenarioId, user.id);
  if (!isOwner) throw new ForbiddenError('Not authorized to update this learning scenario');

  const parsedData = learningScenarioUpdateSchema.parse(data);

  const [updatedLearningScenario] = await db
    .update(learningScenarioTable)
    .set({ ...parsedData })
    .where(eq(learningScenarioTable.id, learningScenarioId))
    .returning();

  if (!updatedLearningScenario) {
    throw new Error('Could not update learning scenario');
  }

  return updatedLearningScenario;
}

/**
 * User can share a learning scenario he owns with the school (access level = school)
 * or unshare it (access level = private).
 * User is not allowed to set the access level to global.
 */
export async function updateLearningScenarioAccessLevel({
  learningScenarioId,
  accessLevel,
  userId,
}: {
  learningScenarioId: string;
  accessLevel: AccessLevel;
  userId: string;
}) {
  checkParameterUUID(learningScenarioId);
  accessLevelSchema.parse(accessLevel);

  // Authorization check
  if (accessLevel === 'global') {
    throw new ForbiddenError('Not authorized to set the access level to global');
  }

  const { isOwner } = await getLearningScenarioInfo(learningScenarioId, userId);
  if (!isOwner)
    throw new ForbiddenError('Not authorized to set the access level of this learning scenario');

  // Update the access level in database
  const [updatedLearningScenario] = await db
    .update(learningScenarioTable)
    .set({ accessLevel })
    .where(eq(learningScenarioTable.id, learningScenarioId))
    .returning();

  if (updatedLearningScenario === undefined) {
    throw new Error('Could not update the access level of the learning scenario');
  }

  return updatedLearningScenario;
}

/**
 * User updates the picture of a learning scenario.
 * @throws NotFoundError if the learning scenario does not exist.
 * @throws ForbiddenError if the user is not the owner of the learning scenario.
 */
export async function updateLearningScenarioPicture({
  learningScenarioId,
  picturePath,
  userId,
}: {
  learningScenarioId: string;
  picturePath: string;
  userId: string;
}) {
  checkParameterUUID(learningScenarioId);
  // Authorization check
  const { isOwner } = await getLearningScenarioInfo(learningScenarioId, userId);
  if (!isOwner)
    throw new ForbiddenError('Not authorized to update the picture of this learning scenario');

  const [updatedSharedChat] = await db
    .update(learningScenarioTable)
    .set({ pictureId: picturePath })
    .where(eq(learningScenarioTable.id, learningScenarioId))
    .returning();

  if (!updatedSharedChat) {
    throw new Error('Could not update learning scenario picture');
  }

  return updatedSharedChat;
}

export const learningScenarioShareValuesSchema = z.object({
  telliPointsPercentageLimit: z.number().min(1).max(100),
  usageTimeLimit: z
    .number()
    .min(30)
    .max(30 * 24 * 60),
});
export type LearningScenarioShareValues = z.infer<typeof learningScenarioShareValuesSchema>;

/**
 * Starts sharing of a learning scenario.
 * @throws NotFoundError if the learning scenario does not exist.
 * @throws ForbiddenError if the user is not the owner of the learning scenario.
 */
export async function shareLearningScenario({
  learningScenarioId,
  data,
  schoolId,
  user,
}: {
  learningScenarioId: string;
  data: LearningScenarioShareValues;
  schoolId?: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
}) {
  checkParameterUUID(learningScenarioId);
  // Authorization check: user must be a teacher and must have access to the learning scenario
  if (user.userRole !== 'teacher')
    throw new ForbiddenError('Only a teacher can share a learning scenario');

  const { isOwner, isPrivate, learningScenario } = await getLearningScenarioInfo(
    learningScenarioId,
    user.id,
  );
  if (
    !learningScenario.hasLinkAccess &&
    ((isPrivate && !isOwner) ||
      (!isOwner &&
        learningScenario.accessLevel === 'school' &&
        learningScenario.schoolId !== schoolId))
  )
    throw new ForbiddenError('Not authorized to share this learning scenario');

  const parsedValues = learningScenarioShareValuesSchema.parse(data);

  // share learning scenario instance
  const [maybeExistingEntry] = await db
    .select()
    .from(sharedLearningScenarioTable)
    .where(
      and(
        eq(sharedLearningScenarioTable.userId, user.id),
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioId),
      ),
    );

  const inviteCode = generateInviteCode();

  const startedAt = new Date();
  const [updatedSharedChat] = await db
    .insert(sharedLearningScenarioTable)
    .values({
      id: maybeExistingEntry?.id,
      inviteCode,
      learningScenarioId,
      maxUsageTimeLimit: parsedValues.usageTimeLimit,
      startedAt,
      telliPointsLimit: parsedValues.telliPointsPercentageLimit,
      userId: user.id,
    })
    .onConflictDoUpdate({
      target: sharedLearningScenarioTable.id,
      set: {
        inviteCode,
        maxUsageTimeLimit: parsedValues.usageTimeLimit,
        startedAt,
        telliPointsLimit: parsedValues.telliPointsPercentageLimit,
      },
    })
    .returning();

  if (updatedSharedChat === undefined) {
    throw new Error('Could not share learning scenario');
  }

  return updatedSharedChat;
}

/**
 * Unshares a learning scenario.
 * @throws NotFoundError if the learning scenario does not exist.
 * @throws ForbiddenError if the user is not the owner of the learning scenario.
 */
export async function unshareLearningScenario({
  learningScenarioId,
  user,
}: {
  learningScenarioId: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
}) {
  checkParameterUUID(learningScenarioId);
  // Authorization check: user must be a teacher and owner of the sharing itself
  if (user.userRole !== 'teacher')
    throw new ForbiddenError('Only a teacher can unshare a learning scenario');

  const sharedConversations = await dbGetSharedLearningScenarioConversations({
    learningScenarioId,
    userId: user.id,
  });
  if (sharedConversations.length === 0)
    throw new ForbiddenError('Not authorized to stop this shared learning scenario instance');

  const [deletedShare] = await db
    .delete(sharedLearningScenarioTable)
    .where(
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioId),
        eq(sharedLearningScenarioTable.userId, user.id),
      ),
    )
    .returning();

  if (!deletedShare) {
    throw new Error('Could not unshare learning scenario');
  }

  return deletedShare;
}

/**
 * Loads learning scenario for edit view.
 * Throws if the user is not authorized to access the learning scenario:
 * - NotFound if the learning scenario does not exist
 * - Forbidden if the learning scenario is private and the user is not the owner
 * - Forbidden if the learning scenario is school-level and the user is not in the same school
 *
 * Link sharing bypass: If `hasLinkAccess` is true, access checks are skipped
 * and any authenticated user can view the learning scenario. Note that link sharing
 * only grants read-only access - editing is still restricted to the owner.
 */
export async function getLearningScenarioForEditView({
  learningScenarioId,
  schoolId,
  userId,
}: {
  learningScenarioId: string;
  schoolId: string;
  userId: string;
}): Promise<{
  learningScenario: LearningScenarioOptionalShareDataModel;
  relatedFiles: FileModel[];
  avatarPictureUrl: string | undefined;
}> {
  checkParameterUUID(learningScenarioId);
  const learningScenario = await dbGetLearningScenarioByIdOptionalShareData({
    learningScenarioId,
    userId,
  });
  if (!learningScenario) throw new NotFoundError('Learning scenario not found');
  if (!learningScenario.hasLinkAccess) {
    if (learningScenario.accessLevel === 'private' && learningScenario.userId !== userId)
      throw new ForbiddenError('Not authorized to edit this learning scenario');
    if (learningScenario.accessLevel === 'school' && learningScenario.schoolId !== schoolId)
      throw new ForbiddenError('Not authorized to edit this learning scenario');
  }

  const relatedFiles = await getFilesForLearningScenario({ learningScenarioId, schoolId, userId });
  const avatarPictureUrl = await getAvatarPictureUrl(learningScenario.pictureId);
  return { learningScenario, relatedFiles, avatarPictureUrl };
}

/**
 * Get files linked to a learning scenario.
 *
 * If the learning scenario is private, only the owner can fetch file mappings.
 * If the learning scenario is shared with a school, any teacher in that school can fetch file mappings.
 * If the learning scenario is global, any teacher can fetch those file mappings.
 *
 * Link sharing bypass: If `hasLinkAccess` is true, access checks are skipped
 * and any authenticated user can access the file mappings.
 */
export async function getFilesForLearningScenario({
  learningScenarioId,
  schoolId,
  userId,
}: {
  learningScenarioId: string;
  schoolId: string;
  userId: string;
}): Promise<FileModel[]> {
  checkParameterUUID(learningScenarioId);
  // Authorization check
  const { isOwner, isPrivate, learningScenario } = await getLearningScenarioInfo(
    learningScenarioId,
    userId,
  );
  if (
    !learningScenario.hasLinkAccess &&
    ((isPrivate && !isOwner) ||
      (!isOwner &&
        learningScenario.accessLevel === 'school' &&
        learningScenario.schoolId !== schoolId))
  )
    throw new ForbiddenError('Not authorized to fetch file mappings for this learning scenario');

  return dbGetFilesForLearningScenario(learningScenarioId);
}

/**
 * User creates a new, empty learning scenario.
 */
export async function createNewLearningScenario({
  modelId,
  user,
  schoolId,
}: {
  modelId: string;
  user: UserModel;
  schoolId: string;
}) {
  if (user.userRole !== 'teacher') {
    throw new ForbiddenError('Not authorized to create new learning scenario');
  }

  const [insertedLearningScenario] = await db
    .insert(learningScenarioTable)
    .values({
      name: '',
      pictureId: '',
      modelId,
      userId: user.id,
      schoolId,
    })
    .returning();

  if (!insertedLearningScenario) {
    throw new Error('Could not create learning scenario');
  }

  return insertedLearningScenario;
}

/**
 * This function creates a duplicate of an existing learning scenario,
 * including copying the avatar picture and all related files.
 */
export async function duplicateLearningScenario({
  accessLevel,
  schoolId,
  user,
  originalLearningScenarioId,
}: {
  accessLevel: AccessLevel | undefined;
  originalLearningScenarioId: string;
  schoolId: string;
  user: UserModel;
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
    schoolId: schoolId,
    userId: user.id,
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

  // the path still contains shared-chats because all existing learning scenarios store their picture in this folder in S3
  const newAvatarPictureId = `shared-chats/${newLearningScenarioId}/avatar`;
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
 * Deletes a learning scenario if the user is the owner.
 * @throws NotFoundError if the learning scenario does not exist or the user is not the owner.
 * Also deletes all related files and the avatar picture from S3.
 */
export async function deleteLearningScenario({
  learningScenarioId,
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}) {
  checkParameterUUID(learningScenarioId);
  // Authorization check
  const { isOwner, learningScenario } = await getLearningScenarioInfo(learningScenarioId, userId);
  if (!isOwner) throw new ForbiddenError('Not authorized to delete this learning scenario');

  const relatedFiles = await dbGetFilesForLearningScenario(learningScenarioId);

  // delete learning scenario from db
  const deletedLearningScenario = await dbDeleteLearningScenarioByIdAndUserId({
    learningScenarioId,
    userId,
  });

  // delete avatar picture from S3
  await deleteAvatarPicture(learningScenario.pictureId);

  // delete all related files from s3
  await deleteMessageAttachments(relatedFiles.map((file) => file.id));

  return deletedLearningScenario;
}

/**
 * Links a file to a learning scenario.
 * @throws NotFoundError if the learning scenario does not exist or the user is not the owner.
 */
export async function linkFileToLearningScenario({
  fileId,
  learningScenarioId,
  userId,
}: {
  fileId: string;
  learningScenarioId: string;
  userId: string;
}) {
  checkParameterUUID(learningScenarioId);
  // Authorization check
  const { isOwner } = await getLearningScenarioInfo(learningScenarioId, userId);
  if (!isOwner)
    throw new ForbiddenError('Not authorized to add new file for this learning scenario');

  const [insertedFileMapping] = await db
    .insert(LearningScenarioFileMapping)
    .values({ learningScenarioId: learningScenarioId, fileId: fileId })
    .returning();
  if (insertedFileMapping === undefined) {
    throw new Error('Could not link file to learning scenario');
  }
}

/**
 * Removes a file from a learning scenario.
 * Also deletes the actual file from S3.
 *
 * @throws NotFoundError if the learning scenario does not exist.
 * @throws ForbiddenError if the user is not the owner of the learning scenario.
 */
export async function removeFileFromLearningScenario({
  learningScenarioId,
  fileId,
  userId,
}: {
  learningScenarioId: string;
  fileId: string;
  userId: string;
}) {
  checkParameterUUID(learningScenarioId);
  // Authorization check
  const { isOwner } = await getLearningScenarioInfo(learningScenarioId, userId);
  if (!isOwner) throw new ForbiddenError('Not authorized to delete this file mapping');

  // delete mapping and file entry in db
  await db.transaction(async (tx) => {
    await tx
      .delete(LearningScenarioFileMapping)
      .where(
        and(
          eq(LearningScenarioFileMapping.learningScenarioId, learningScenarioId),
          eq(LearningScenarioFileMapping.fileId, fileId),
        ),
      );
    await tx.delete(fileTable).where(eq(fileTable.id, fileId));
  });

  // Delete the file from S3
  await deleteMessageAttachments([fileId]);
}

export async function enrichLearningScenarioWithPictureUrl({
  learningScenarios,
}: {
  learningScenarios: LearningScenarioOptionalShareDataModel[];
}): Promise<LearningScenarioWithImage[]> {
  return await Promise.all(
    learningScenarios.map(async (scenario) => ({
      ...scenario,
      maybeSignedPictureUrl: await getReadOnlySignedUrl({
        key: scenario.pictureId ? `shared-chats/${scenario.id}/avatar` : undefined,
      }),
    })),
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

export async function uploadAvatarPictureForLearningScenario({
  learningScenarioId,
  croppedImageBlob,
  userId,
}: {
  learningScenarioId: string;
  croppedImageBlob: Blob;
  userId: string;
}) {
  checkParameterUUID(learningScenarioId);
  // Authorization check
  const { isOwner } = await getLearningScenarioInfo(learningScenarioId, userId);
  if (!isOwner)
    throw new ForbiddenError('Not authorized to upload picture for this learning scenario');

  const key = `shared-chats/${learningScenarioId}/avatar`;

  await uploadFileToS3({
    key: key,
    body: croppedImageBlob,
    contentType: croppedImageBlob.type,
  });

  return key;
}
