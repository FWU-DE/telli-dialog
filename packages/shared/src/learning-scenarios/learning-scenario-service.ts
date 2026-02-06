import { UserModel } from '@shared/auth/user-model';
import { db } from '@shared/db';
import { dbGetFilesForLearningScenario } from '@shared/db/functions/files';
import {
  dbDeleteLearningScenarioByIdAndUserId,
  dbGetLearningScenarioById,
  dbGetLearningScenarioByIdOptionalShareData,
  dbGetLearningScenarioByIdWithShareData,
  dbGetLearningScenariosByUserId,
} from '@shared/db/functions/learning-scenario';
import {
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
import { getReadOnlySignedUrl, uploadFileToS3 } from '@shared/s3';
import { generateInviteCode } from '@shared/sharing/generate-invite-code';
import { addDays } from '@shared/utils/date';
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
 * Get learning scenario by id for editing or sharing purpose.
 * @throws NotFoundError if the learning scenario does not exist.
 * @throws ForbiddenError if the user is not the owner of the learning scenario.
 */
export async function getLearningScenario({
  learningScenarioId,
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}) {
  checkParameterUUID(learningScenarioId);
  const learningScenario = await dbGetLearningScenarioById({
    userId,
    learningScenarioId,
  });

  if (!learningScenario) throw new NotFoundError('Learning scenario not found');
  if (learningScenario.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this learning scenario');
  }
  return learningScenario;
}

/**
 * Returns a learning scenario with invite code and other sharing related data for sharing page.
 * @throws NotFoundError if learning scenario does not exist or is not shared
 */
export const getSharedLearningScenario = async ({
  learningScenarioId,
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}): Promise<LearningScenarioWithShareDataModel> => {
  checkParameterUUID(learningScenarioId);
  const learningScenario = await dbGetLearningScenarioByIdWithShareData({
    learningScenarioId,
    userId,
  });
  if (!learningScenario || !learningScenario.inviteCode) {
    throw new NotFoundError('Learning scenario not found');
  }

  return learningScenario;
};

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
  // this function also serves as a check that the user is the owner
  await getLearningScenario({
    learningScenarioId,
    userId: user.id,
  });

  const parsedData = learningScenarioUpdateSchema.parse(data);

  const [updatedLearningScenario] = await db
    .update(learningScenarioTable)
    .set({ ...parsedData })
    .where(
      and(
        eq(learningScenarioTable.id, learningScenarioId),
        eq(learningScenarioTable.userId, user.id),
      ),
    )
    .returning();

  if (!updatedLearningScenario) {
    throw new Error('Could not update learning scenario');
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
  await getLearningScenario({
    learningScenarioId,
    userId,
  });

  const [updatedSharedChat] = await db
    .update(learningScenarioTable)
    .set({ pictureId: picturePath })
    .where(
      and(
        eq(learningScenarioTable.id, learningScenarioId),
        eq(learningScenarioTable.userId, userId),
      ),
    )
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
  userId,
}: {
  learningScenarioId: string;
  data: LearningScenarioShareValues;
  userId: string;
}) {
  await getLearningScenario({ learningScenarioId, userId });

  const parsedValues = learningScenarioShareValuesSchema.parse(data);

  // share learning scenario instance
  const [maybeExistingEntry] = await db
    .select()
    .from(sharedLearningScenarioTable)
    .where(
      and(
        eq(sharedLearningScenarioTable.userId, userId),
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
      userId,
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
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}) {
  await getLearningScenario({
    learningScenarioId,
    userId,
  });

  const [deletedShare] = await db
    .delete(sharedLearningScenarioTable)
    .where(
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioId),
        eq(sharedLearningScenarioTable.userId, userId),
      ),
    )
    .returning();

  if (!deletedShare) {
    throw new Error('Could not unshare learning scenario');
  }

  return deletedShare;
}

export const getLearningScenarioForEditView = async ({
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
}> => {
  checkParameterUUID(learningScenarioId);
  const learningScenario = await dbGetLearningScenarioByIdOptionalShareData({
    learningScenarioId,
    userId,
  });
  if (!learningScenario) throw new NotFoundError('Learning scenario not found');
  if (learningScenario.accessLevel === 'private' && learningScenario.userId !== userId)
    throw new ForbiddenError('Not authorized to edit this learning scenario');
  if (learningScenario.accessLevel === 'school' && learningScenario.schoolId !== schoolId)
    throw new ForbiddenError('Not authorized to edit this learning scenario');

  const relatedFiles = await getFilesForLearningScenario({ learningScenarioId, userId });
  const avatarPictureUrl = await getAvatarPictureUrl(learningScenario.pictureId);
  return { learningScenario, relatedFiles, avatarPictureUrl };
};

/**
 * Get files linked to a learning scenario.
 * If the user is not the owner of the learning scenario, an empty array is returned.
 */
export async function getFilesForLearningScenario({
  learningScenarioId,
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}): Promise<FileModel[]> {
  checkParameterUUID(learningScenarioId);
  return dbGetFilesForLearningScenario(learningScenarioId, userId);
}

/**
 * User creates a new learning scenario.
 */
export async function createNewLearningScenario({
  modelId,
  user,
}: {
  modelId: string;
  user: UserModel;
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
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}) {
  checkParameterUUID(learningScenarioId);
  const learningScenario = await dbGetLearningScenarioById({
    learningScenarioId,
    userId,
  });
  if (!learningScenario) throw new NotFoundError('Learning scenario not found');

  const relatedFiles = await dbGetFilesForLearningScenario(learningScenarioId, userId);

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
  const learningScenario = await dbGetLearningScenarioById({
    learningScenarioId,
    userId,
  });
  if (!learningScenario) throw new NotFoundError('Learning scenario not found');

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

  // get learning scenario for access check
  await getLearningScenario({ learningScenarioId, userId });

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

async function enrichLearningScenarioWithPictureUrl({
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
  await getLearningScenario({
    learningScenarioId,
    userId,
  });

  const key = `shared-chats/${learningScenarioId}/avatar`;

  await uploadFileToS3({
    key: key,
    body: croppedImageBlob,
    contentType: croppedImageBlob.type,
  });

  return key;
}
