import { UserModel } from '@shared/auth/user-model';
import { db } from '@shared/db';
import { dbGetFilesForLearningScenario } from '@shared/db/functions/files';
import {
  dbDeleteSharedSchoolChatByIdAndUserId,
  dbGetSharedChatsByUserId,
  dbGetSharedSchoolChatById,
} from '@shared/db/functions/shared-school-chat';
import {
  FileModel,
  fileTable,
  SharedSchoolConversationFileMapping,
  sharedSchoolConversationInsertSchema,
  SharedSchoolConversationSelectModel,
  sharedSchoolConversationTable,
  sharedSchoolConversationUpdateSchema,
} from '@shared/db/schema';
import { checkParameterUUID, ForbiddenError, NotFoundError } from '@shared/error';
import { deleteAvatarPicture, deleteMessageAttachment } from '@shared/files/fileService';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { generateInviteCode } from '@shared/sharing/generate-invite-code';
import { addDays } from '@shared/utils/date';
import { and, eq, lt } from 'drizzle-orm';
import z from 'zod';

export type LearningScenarioWithImage = SharedSchoolConversationSelectModel & {
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
  const learningScenarios = await dbGetSharedChatsByUserId({ userId });
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
  const learningScenario = await dbGetSharedSchoolChatById({
    userId,
    sharedChatId: learningScenarioId,
  });

  if (!learningScenario) throw new NotFoundError('Learning scenario not found');
  if (learningScenario.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this learning scenario');
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
  data: SharedSchoolConversationSelectModel;
}) {
  // this function also serves as a check that the user is the owner
  await getLearningScenario({
    learningScenarioId,
    userId: user.id,
  });

  const parsedData = sharedSchoolConversationUpdateSchema.parse(data);

  const [updatedLearningScenario] = await db
    .update(sharedSchoolConversationTable)
    .set({ ...parsedData })
    .where(
      and(
        eq(sharedSchoolConversationTable.id, learningScenarioId),
        eq(sharedSchoolConversationTable.userId, user.id),
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
    .update(sharedSchoolConversationTable)
    .set({ pictureId: picturePath })
    .where(
      and(
        eq(sharedSchoolConversationTable.id, learningScenarioId),
        eq(sharedSchoolConversationTable.userId, userId),
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
  await getLearningScenario({
    learningScenarioId,
    userId: userId,
  });

  const parsedValues = learningScenarioShareValuesSchema.parse(data);

  const inviteCode = generateInviteCode();

  const [updatedSharedChat] = await db
    .update(sharedSchoolConversationTable)
    .set({
      telliPointsLimit: parsedValues.telliPointsPercentageLimit,
      maxUsageTimeLimit: parsedValues.usageTimeLimit,
      inviteCode,
      startedAt: new Date(),
    })
    .where(
      and(
        eq(sharedSchoolConversationTable.id, learningScenarioId),
        eq(sharedSchoolConversationTable.userId, userId),
      ),
    )
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

  const [updatedSharedChat] = await db
    .update(sharedSchoolConversationTable)
    .set({
      startedAt: null,
      telliPointsLimit: null,
      maxUsageTimeLimit: null,
    })
    .where(
      and(
        eq(sharedSchoolConversationTable.id, learningScenarioId),
        eq(sharedSchoolConversationTable.userId, userId),
      ),
    )
    .returning();

  if (!updatedSharedChat) {
    throw new Error('Could not unshare learning scenario');
  }

  return updatedSharedChat;
}

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

export const learningScenarioInsertSchema = sharedSchoolConversationInsertSchema.omit({
  userId: true,
});
export type LearningScenarioInsertModel = z.infer<typeof learningScenarioInsertSchema>;

/**
 * User creates a new learning scenario.
 */
export async function createNewLearningScenario({
  data,
  user,
}: {
  data: LearningScenarioInsertModel;
  user: UserModel;
}) {
  if (user.userRole !== 'teacher') {
    throw new ForbiddenError('Not authorized to create new learning scenario');
  }

  const parsedData = learningScenarioInsertSchema.parse(data);

  const [insertedSharedChat] = await db
    .insert(sharedSchoolConversationTable)
    .values({ ...parsedData, userId: user.id })
    .returning();

  if (!insertedSharedChat) {
    throw new Error('Could not create learning scenario');
  }

  return insertedSharedChat;
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
  const learningScenario = await dbGetSharedSchoolChatById({
    sharedChatId: learningScenarioId,
    userId,
  });
  if (!learningScenario) throw new NotFoundError('Learning scenario not found');

  const relatedFiles = await dbGetFilesForLearningScenario(learningScenarioId, userId);

  // delete learning scenario from db
  const deletedLearningScenario = await dbDeleteSharedSchoolChatByIdAndUserId({
    sharedChatId: learningScenarioId,
    userId,
  });

  // delete avatar picture from S3
  await deleteAvatarPicture(learningScenario.pictureId);

  // delete all related files from s3
  await Promise.allSettled(
    relatedFiles.map((file) => deleteMessageAttachment({ fileId: file.id })),
  );

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
  const learningScenario = await dbGetSharedSchoolChatById({
    sharedChatId: learningScenarioId,
    userId,
  });
  if (!learningScenario) throw new NotFoundError('Learning scenario not found');

  const [insertedFileMapping] = await db
    .insert(SharedSchoolConversationFileMapping)
    .values({ sharedSchoolConversationId: learningScenarioId, fileId: fileId })
    .returning();
  if (insertedFileMapping === undefined) {
    throw new Error('Could not link file to learning scenario');
  }
}

/**
 * Removes a file from a learning scenario.
 * Also deletes the actual file from S3.
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
      .delete(SharedSchoolConversationFileMapping)
      .where(
        and(
          eq(SharedSchoolConversationFileMapping.sharedSchoolConversationId, learningScenarioId),
          eq(SharedSchoolConversationFileMapping.fileId, fileId),
        ),
      );
    await tx.delete(fileTable).where(eq(fileTable.id, fileId));
  });

  // Delete the file from S3
  await deleteMessageAttachment({ fileId });
}

async function enrichLearningScenarioWithPictureUrl({
  learningScenarios,
}: {
  learningScenarios: SharedSchoolConversationSelectModel[];
}): Promise<LearningScenarioWithImage[]> {
  return await Promise.all(
    learningScenarios.map(async (scenario) => ({
      ...scenario,
      maybeSignedPictureUrl: await getMaybeSignedUrlFromS3Get({
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
    .delete(sharedSchoolConversationTable)
    .where(
      and(
        eq(sharedSchoolConversationTable.name, ''),
        lt(sharedSchoolConversationTable.createdAt, addDays(new Date(), -1)),
      ),
    )
    .returning();
  return result.length;
}
