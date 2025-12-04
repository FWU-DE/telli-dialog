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
  SharedSchoolConversationInsertModel,
  SharedSchoolConversationModel,
  sharedSchoolConversationTable,
  sharedSchoolConversationUpdateSchema,
} from '@shared/db/schema';
import { ForbiddenError, NotFoundError } from '@shared/error';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { generateInviteCode } from '@shared/sharing/generateInviteCode';
import { and, eq } from 'drizzle-orm';
import z from 'zod';

export type LearningScenarioWithImage = SharedSchoolConversationModel & {
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
 * Get learning scenario by id for editing purposes.
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
  data: SharedSchoolConversationModel;
}) {
  // this function also serves as a check that the user is the owner
  await getLearningScenario({
    learningScenarioId,
    userId: user.id,
  });

  const parsedData = sharedSchoolConversationUpdateSchema.parse(data);

  const [updatedLearningScenarion] = await db
    .update(sharedSchoolConversationTable)
    .set({ ...parsedData })
    .where(
      and(
        eq(sharedSchoolConversationTable.id, learningScenarioId),
        eq(sharedSchoolConversationTable.userId, user.id),
      ),
    )
    .returning();

  if (!updatedLearningScenarion) {
    throw new Error('Could not update learning scenario');
  }

  return updatedLearningScenarion;
}

/**
 * User updates the picture of a learning scenario.
 * @throws NotFoundError if the learning scenario does not exist.
 * @throws ForbiddenError if the user is not the owner of the learning scenario.
 */
export async function updateLearningScenarioPicture({
  id: sharedChatId,
  picturePath,
  userId,
}: {
  id: string;
  picturePath: string;
  userId: string;
}) {
  await getLearningScenario({
    learningScenarioId: sharedChatId,
    userId,
  });

  const [updatedSharedChat] = await db
    .update(sharedSchoolConversationTable)
    .set({ pictureId: picturePath })
    .where(
      and(
        eq(sharedSchoolConversationTable.id, sharedChatId),
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
  intelliPointsPercentageLimit: z.number().min(1).max(100),
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

  const randomString = generateInviteCode();

  const [updatedSharedChat] = await db
    .update(sharedSchoolConversationTable)
    .set({
      intelligencePointsLimit: parsedValues.intelliPointsPercentageLimit,
      maxUsageTimeLimit: parsedValues.usageTimeLimit,
      inviteCode: randomString.toUpperCase(),
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
      intelligencePointsLimit: null,
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
  return dbGetFilesForLearningScenario(learningScenarioId, userId);
}

/**
 * Calculates the time left for a learning scenario that is shared.
 */
export function calculateTimeLeftForLearningScenario({
  startedAt,
  maxUsageTimeLimit,
}: {
  startedAt: Date | null;
  maxUsageTimeLimit: number | null;
}) {
  if (startedAt === null || maxUsageTimeLimit === null) {
    return -1;
  }

  const startedAtDate = new Date(startedAt);

  const nowUtc = new Date().toISOString();
  const nowUtcDate = new Date(nowUtc);

  const sharedChatTimeLeft =
    maxUsageTimeLimit * 60 - Math.floor((nowUtcDate.getTime() - startedAtDate.getTime()) / 1000);

  return sharedChatTimeLeft;
}

export type LearningScenarioInsertModel = Omit<SharedSchoolConversationInsertModel, 'userId'>;
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

  const [insertedSharedChat] = await db
    .insert(sharedSchoolConversationTable)
    .values({ ...data, userId: user.id })
    .returning();

  if (!insertedSharedChat) {
    throw new Error('Could not create learning scenario');
  }

  return insertedSharedChat;
}

/**
 * Deletes a learning scenario if the user is the owner.
 * @throws NotFoundError if the learning scenario does not exist or the user is not the owner.
 */
export async function deleteLearningScenario({
  learningScenarioId,
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}) {
  const learningScenario = await dbGetSharedSchoolChatById({
    sharedChatId: learningScenarioId,
    userId,
  });
  if (!learningScenario) throw new NotFoundError('Learning scenario not found');

  return dbDeleteSharedSchoolChatByIdAndUserId({
    sharedChatId: learningScenarioId,
    userId,
  });
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
  await getLearningScenario({ learningScenarioId, userId });

  await db.transaction(async (tx) => {
    await tx
      .delete(SharedSchoolConversationFileMapping)
      .where(eq(SharedSchoolConversationFileMapping.fileId, fileId));
    await tx.delete(fileTable).where(eq(fileTable.id, fileId));
  });
}

async function enrichLearningScenarioWithPictureUrl({
  learningScenarios,
}: {
  learningScenarios: SharedSchoolConversationModel[];
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
