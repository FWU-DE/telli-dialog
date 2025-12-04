import { UserModel } from '@shared/auth/user-model';
import { db } from '@shared/db';
import {
  dbDeleteSharedSchoolChatByIdAndUserId,
  dbGetSharedChatsByUserId,
  dbGetSharedSchoolChatById,
} from '@shared/db/functions/shared-school-chat';
import {
  SharedSchoolConversationFileMapping,
  SharedSchoolConversationInsertModel,
  SharedSchoolConversationModel,
  sharedSchoolConversationTable,
} from '@shared/db/schema';
import { ForbiddenError, NotFoundError } from '@shared/error';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';

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
