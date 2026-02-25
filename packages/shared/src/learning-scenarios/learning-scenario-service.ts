import { UserModel } from '@shared/auth/user-model';
import { db } from '@shared/db';
import { dbGetFilesForLearningScenario } from '@shared/db/functions/files';
import {
  dbCreateLearningScenarioShare,
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
  getAvatarPictureUrl,
} from '@shared/files/fileService';
import { uploadFileToS3 } from '@shared/s3';
import { generateInviteCode } from '@shared/sharing/generate-invite-code';
import { and, eq } from 'drizzle-orm';
import z from 'zod';
import { duplicateLearningScenario } from '@shared/learning-scenarios/learning-scenario-admin-service';
import {
  requireTeacherRole,
  verifyReadAccess,
  verifyWriteAccess,
} from '@shared/auth/authorization-service';

export type LearningScenarioWithImage = LearningScenarioOptionalShareDataModel & {
  maybeSignedPictureUrl: string | undefined;
};

export function buildLearningScenarioPictureKey(characterId: string) {
  // the path still contains shared-chats because all existing learning scenarios store their picture in this folder in S3
  return `shared-chats/${characterId}/avatar`;
}

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
async function getLearningScenarioInfo(
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
 * Schema for updating character details that are allowed to be changed by the user.
 */
const updateLearningScenarioSchema = learningScenarioUpdateSchema.omit({
  accessLevel: true,
  isDeleted: true,
  originalLearningScenarioId: true,
  pictureId: true,
  schoolId: true,
});
export type UpdateLearningScenarioActionModel = z.infer<typeof updateLearningScenarioSchema>;

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
  user: Pick<UserModel, 'id' | 'userRole'>;
  data: LearningScenarioSelectModel;
}) {
  checkParameterUUID(learningScenarioId);
  requireTeacherRole(user.userRole);
  const { learningScenario } = await getLearningScenarioInfo(learningScenarioId, user.id);
  verifyWriteAccess({ item: learningScenario, userId: user.id });

  const parsedData = updateLearningScenarioSchema.parse(data);

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
  user,
}: {
  learningScenarioId: string;
  accessLevel: AccessLevel;
  user: Pick<UserModel, 'id' | 'userRole'>;
}) {
  checkParameterUUID(learningScenarioId);
  accessLevelSchema.parse(accessLevel);

  // Authorization check
  if (accessLevel === 'global') {
    throw new ForbiddenError('Not authorized to set the access level to global');
  }

  requireTeacherRole(user.userRole);
  const { learningScenario } = await getLearningScenarioInfo(learningScenarioId, user.id);
  verifyWriteAccess({ item: learningScenario, userId: user.id });

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
  user,
}: {
  learningScenarioId: string;
  picturePath: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
}) {
  checkParameterUUID(learningScenarioId);
  requireTeacherRole(user.userRole);
  const { learningScenario } = await getLearningScenarioInfo(learningScenarioId, user.id);
  verifyWriteAccess({ item: learningScenario, userId: user.id });

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
  requireTeacherRole(user.userRole);

  const { learningScenario } = await getLearningScenarioInfo(learningScenarioId, user.id);
  verifyReadAccess({ item: learningScenario, schoolId, userId: user.id });

  const parsedValues = learningScenarioShareValuesSchema.parse(data);

  const inviteCode = generateInviteCode();
  const startedAt = new Date();
  const sharedLearningScenario = await dbCreateLearningScenarioShare({
    userId: user.id,
    learningScenarioId,
    inviteCode,
    startedAt,
    telliPointsLimit: parsedValues.telliPointsPercentageLimit,
    maxUsageTimeLimit: parsedValues.usageTimeLimit,
  });

  if (!sharedLearningScenario) {
    throw new Error('Could not share learning scenario');
  }

  return sharedLearningScenario;
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
  requireTeacherRole(user.userRole);

  const sharedConversations = await dbGetSharedLearningScenarioConversations({
    learningScenarioId,
    userId: user.id,
  });
  if (sharedConversations.length === 0)
    throw new ForbiddenError('Not authorized to stop this shared learning scenario instance');

  const [updatedShare] = await db
    .update(sharedLearningScenarioTable)
    .set({ startedAt: null, maxUsageTimeLimit: null, telliPointsLimit: null })
    .where(
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioId),
        eq(sharedLearningScenarioTable.userId, user.id),
      ),
    )
    .returning();

  if (!updatedShare) {
    throw new Error('Could not unshare learning scenario');
  }

  return updatedShare;
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
  user,
}: {
  learningScenarioId: string;
  schoolId: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
}): Promise<{
  learningScenario: LearningScenarioOptionalShareDataModel;
  relatedFiles: FileModel[];
  avatarPictureUrl: string | undefined;
}> {
  checkParameterUUID(learningScenarioId);
  requireTeacherRole(user.userRole);
  const learningScenario = await dbGetLearningScenarioByIdOptionalShareData({
    learningScenarioId,
    userId: user.id,
  });
  if (!learningScenario) throw new NotFoundError('Learning scenario not found');
  verifyReadAccess({ item: learningScenario, schoolId, userId: user.id });

  const relatedFiles = await getFilesForLearningScenario({
    learningScenarioId,
    schoolId,
    user,
  });
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
  user,
}: {
  learningScenarioId: string;
  schoolId: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
}): Promise<FileModel[]> {
  checkParameterUUID(learningScenarioId);
  requireTeacherRole(user.userRole);
  const { learningScenario } = await getLearningScenarioInfo(learningScenarioId, user.id);
  verifyReadAccess({ item: learningScenario, schoolId, userId: user.id });

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
  user: Pick<UserModel, 'id' | 'userRole'>;
  schoolId: string;
}) {
  requireTeacherRole(user.userRole);

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
 * Deletes a learning scenario if the user is the owner.
 * @throws NotFoundError if the learning scenario does not exist or the user is not the owner.
 * Also deletes all related files and the avatar picture from S3.
 */
export async function deleteLearningScenario({
  learningScenarioId,
  user,
}: {
  learningScenarioId: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
}) {
  checkParameterUUID(learningScenarioId);
  requireTeacherRole(user.userRole);
  const { learningScenario } = await getLearningScenarioInfo(learningScenarioId, user.id);
  verifyWriteAccess({ item: learningScenario, userId: user.id });

  const relatedFiles = await dbGetFilesForLearningScenario(learningScenarioId);

  // delete learning scenario from db
  const deletedLearningScenario = await dbDeleteLearningScenarioByIdAndUserId({
    learningScenarioId,
    userId: user.id,
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
  user,
}: {
  fileId: string;
  learningScenarioId: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
}) {
  checkParameterUUID(learningScenarioId);
  requireTeacherRole(user.userRole);
  const { learningScenario } = await getLearningScenarioInfo(learningScenarioId, user.id);
  verifyWriteAccess({ item: learningScenario, userId: user.id });

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
  user,
}: {
  learningScenarioId: string;
  fileId: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
}) {
  checkParameterUUID(learningScenarioId);
  requireTeacherRole(user.userRole);
  const { learningScenario } = await getLearningScenarioInfo(learningScenarioId, user.id);
  verifyWriteAccess({ item: learningScenario, userId: user.id });

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
      maybeSignedPictureUrl: await getAvatarPictureUrl(scenario.pictureId),
    })),
  );
}

export async function uploadAvatarPictureForLearningScenario({
  learningScenarioId,
  croppedImageBlob,
  user,
}: {
  learningScenarioId: string;
  croppedImageBlob: Blob;
  user: Pick<UserModel, 'id' | 'userRole'>;
}) {
  checkParameterUUID(learningScenarioId);
  requireTeacherRole(user.userRole);
  const { learningScenario } = await getLearningScenarioInfo(learningScenarioId, user.id);
  verifyWriteAccess({ item: learningScenario, userId: user.id });

  const key = buildLearningScenarioPictureKey(learningScenarioId);

  await uploadFileToS3({
    key: key,
    body: croppedImageBlob,
    contentType: croppedImageBlob.type,
  });

  return key;
}

/**
 * User creates a new learning scenario from a template.
 * All files are duplicated and linked to the new learning scenario.
 *
 * Authorization checks:
 * - User must be a teacher.
 * - User must have access to the template.
 *
 * @returns the newly created learning scenario
 */
export async function createNewLearningScenarioFromTemplate({
  schoolId,
  user,
  originalLearningScenarioId,
}: {
  originalLearningScenarioId: string;
  schoolId: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
}) {
  checkParameterUUID(originalLearningScenarioId);
  requireTeacherRole(user.userRole);
  const { learningScenario } = await getLearningScenarioInfo(originalLearningScenarioId, user.id);
  verifyReadAccess({ item: learningScenario, schoolId, userId: user.id });

  return duplicateLearningScenario({
    accessLevel: 'private',
    originalLearningScenarioId,
    schoolId,
    userId: user.id,
  });
}
