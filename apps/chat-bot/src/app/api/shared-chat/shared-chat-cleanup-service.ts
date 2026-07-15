import { db } from '@shared/db';
import {
  fileTable,
  sharedCharacterConversation,
  sharedLearningScenarioTable,
} from '@shared/db/schema';
import { deleteMessageAttachments } from '@shared/files/fileService';
import { addDays } from '@shared/utils/date';
import { and, inArray, isNotNull, isNull, lt } from 'drizzle-orm';
import { isSharedChatFileMetadata, SharedChatFileMetadata } from '.';

const EXPIRATION_OFFSET_IN_DAYS = -1;

type SharedFileCandidate = {
  id: string;
  metadata: Pick<SharedChatFileMetadata, 'inviteCode' | 'entityType' | 'entityId'>;
};

/**
 * Cleans up files uploaded in shared chats whose linked shared entity expired more than one day ago.
 *
 * The function removes conversation mappings and database rows, then deletes corresponding S3 objects.
 */
export async function cleanupExpiredSharedChatFiles(): Promise<number> {
  const maybeSharedFiles = await db
    .select({ id: fileTable.id, metadata: fileTable.metadata })
    .from(fileTable)
    .where(and(isNull(fileTable.userId), isNotNull(fileTable.metadata)));

  const sharedFiles: SharedFileCandidate[] = maybeSharedFiles
    .map((file) => {
      if (isSharedChatFileMetadata(file.metadata)) {
        return file;
      }
      return undefined;
    })
    .filter((file): file is SharedFileCandidate => file !== undefined);

  if (sharedFiles.length === 0) {
    return 0;
  }

  const cutoffDate = addDays(new Date(), EXPIRATION_OFFSET_IN_DAYS);

  const characterInviteCodes = [
    ...new Set(
      sharedFiles
        .filter((file) => file.metadata.entityType === 'character')
        .map((file) => file.metadata.inviteCode),
    ),
  ];

  const learningScenarioInviteCodes = [
    ...new Set(
      sharedFiles
        .filter((file) => file.metadata.entityType === 'learningScenario')
        .map((file) => file.metadata.inviteCode),
    ),
  ];

  const [expiredCharacterShares, expiredLearningScenarioShares] = await Promise.all([
    getExpiredCharacterShares(characterInviteCodes, cutoffDate),
    getExpiredLearningScenarioShares(learningScenarioInviteCodes, cutoffDate),
  ]);

  const expiredCharacterKeys = new Set(
    expiredCharacterShares.map((share) => `${share.inviteCode}:${share.entityId}`),
  );
  const expiredLearningScenarioKeys = new Set(
    expiredLearningScenarioShares.map((share) => `${share.inviteCode}:${share.entityId}`),
  );

  const fileIdsToDelete = getExpiredSharedChatFileIds(
    sharedFiles,
    expiredCharacterKeys,
    expiredLearningScenarioKeys,
  );

  if (fileIdsToDelete.length === 0) {
    return 0;
  }

  await deleteMessageAttachments(fileIdsToDelete);

  return fileIdsToDelete.length;
}

function getExpiredSharedChatFileIds(
  sharedFiles: SharedFileCandidate[],
  expiredCharacterKeys: Set<string>,
  expiredLearningScenarioKeys: Set<string>,
) {
  return sharedFiles
    .filter((file) => {
      const key = `${file.metadata.inviteCode}:${file.metadata.entityId}`;

      if (file.metadata.entityType === 'character') {
        return expiredCharacterKeys.has(key);
      }

      return expiredLearningScenarioKeys.has(key);
    })
    .map((file) => file.id);
}

async function getExpiredCharacterShares(characterInviteCodes: string[], cutoffDate: Date) {
  if (characterInviteCodes.length === 0) return [];

  return db
    .select({
      inviteCode: sharedCharacterConversation.inviteCode,
      entityId: sharedCharacterConversation.characterId,
    })
    .from(sharedCharacterConversation)
    .where(
      and(
        inArray(sharedCharacterConversation.inviteCode, characterInviteCodes),
        lt(sharedCharacterConversation.expiredAt, cutoffDate),
      ),
    );
}

async function getExpiredLearningScenarioShares(
  learningScenarioInviteCodes: string[],
  cutoffDate: Date,
) {
  if (learningScenarioInviteCodes.length === 0) return [];

  return db
    .select({
      inviteCode: sharedLearningScenarioTable.inviteCode,
      entityId: sharedLearningScenarioTable.learningScenarioId,
    })
    .from(sharedLearningScenarioTable)
    .where(
      and(
        inArray(sharedLearningScenarioTable.inviteCode, learningScenarioInviteCodes),
        lt(sharedLearningScenarioTable.expiredAt, cutoffDate),
      ),
    );
}
