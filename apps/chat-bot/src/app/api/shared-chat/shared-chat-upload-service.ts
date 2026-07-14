import { getUserAndContextByUserId } from '@/auth/utils';
import { dbGetCharacterByIdAndInviteCode } from '@shared/db/functions/character';
import { dbGetLearningScenarioByIdAndInviteCode } from '@shared/db/functions/learning-scenario';
import { InvalidArgumentError, NotFoundError } from '@shared/error';
import { SharedChatFileMetadata, SharedEntityContext, SharedSessionId, verify } from '.';
import { uploadFile } from '../file-operations/file-upload-service';

export function buildSharedChatFileMetadata({
  context,
  sharedSessionId,
}: {
  context: SharedEntityContext;
  sharedSessionId: string;
}): SharedChatFileMetadata {
  return {
    sharedChatSessionId: sharedSessionId,
    sharedChatInviteCode: context.inviteCode,
    sharedChatEntityType: context.entityType,
    sharedChatEntityId: context.entityId,
  };
}

export async function resolveSharedChatEntityContext({
  inviteCode,
  entityType,
  entityId,
}: {
  inviteCode: string;
  entityType: 'character' | 'learningScenario';
  entityId: string;
}): Promise<SharedEntityContext> {
  let sharedEntity:
    | Awaited<ReturnType<typeof dbGetCharacterByIdAndInviteCode>>
    | Awaited<ReturnType<typeof dbGetLearningScenarioByIdAndInviteCode>>;

  if (entityType === 'character') {
    sharedEntity = await dbGetCharacterByIdAndInviteCode({
      id: entityId,
      inviteCode,
    });
  } else {
    sharedEntity = await dbGetLearningScenarioByIdAndInviteCode({
      learningScenarioId: entityId,
      inviteCode,
    });
  }

  if (sharedEntity === undefined || sharedEntity.startedBy === null) {
    throw new NotFoundError('Shared chat not found');
  }

  verify.sharedChatCanBeAccessed(sharedEntity);

  const teacher = await getUserAndContextByUserId({ userId: sharedEntity.startedBy });

  return {
    startedBy: sharedEntity.startedBy,
    federalStateId: teacher.federalState.id,
    inviteCode,
    entityType,
    entityId,
  };
}

/**
 * Uploads a file for a shared (invite-based) chat.
 * Files are stored with `userId: null` and a metadata object
 * that contains invite code and session information.
 */
export async function uploadSharedChatFile({
  file,
  inviteCode,
  entityType,
  entityId,
  sharedSessionId,
}: {
  file: File;
  inviteCode: string;
  entityType: 'character' | 'learningScenario';
  entityId: string;
  sharedSessionId: SharedSessionId;
}): Promise<string> {
  if (sharedSessionId.trim() === '') {
    throw new InvalidArgumentError('sharedSessionId is required');
  }

  const context = await resolveSharedChatEntityContext({
    inviteCode,
    entityType,
    entityId,
  });

  const fileMetadata = buildSharedChatFileMetadata({
    context,
    sharedSessionId,
  });

  return uploadFile({
    file,
    fileMetadata,
    userId: null,
    federalStateId: context.federalStateId,
  });
}
