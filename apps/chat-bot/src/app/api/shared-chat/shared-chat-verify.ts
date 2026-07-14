import { ForbiddenError } from '@shared/error';
import { SharedEntityContext, SharedSessionId } from './shared-chat-types';
import { FileMetadata } from '@shared/db/schema';

function isSharedChatFileOwnedBySession({
  metadata,
  context,
  sharedSessionId,
}: {
  metadata: FileMetadata | null;
  context: Pick<SharedEntityContext, 'inviteCode' | 'entityType' | 'entityId'>;
  sharedSessionId: SharedSessionId;
}): boolean {
  if (metadata === null) {
    return false;
  }

  return (
    metadata.sharedChatInviteCode === context.inviteCode &&
    metadata.sharedChatEntityType === context.entityType &&
    metadata.sharedChatEntityId === context.entityId &&
    metadata.sharedChatSessionId === sharedSessionId
  );
}

export function verifySharedChatFileOwnershipBySession(
  files: { metadata: FileMetadata | null }[],
  context: Pick<SharedEntityContext, 'inviteCode' | 'entityType' | 'entityId'>,
  sharedSessionId: SharedSessionId,
): void {
  for (const fileMetadata of files.map((file) => file.metadata)) {
    if (
      !isSharedChatFileOwnedBySession({
        metadata: fileMetadata,
        context: context,
        sharedSessionId: sharedSessionId,
      })
    ) {
      throw new ForbiddenError('Not authorized to access this file');
    }
  }
}

export function verifySharedSessionIdIsNotEmpty(
  sharedSessionId: SharedSessionId | undefined,
): asserts sharedSessionId is SharedSessionId {
  if (sharedSessionId === undefined || sharedSessionId.trim() === '') {
    throw new ForbiddenError('Not authorized to use uploaded files');
  }
}

export function verifyFilesDoNotBelongToAnyUser(files: { userId: string | null }[]): void {
  const unauthorizedFiles = files.filter((file) => file.userId !== null);
  if (unauthorizedFiles.length > 0) {
    throw new ForbiddenError('Not authorized to use one or more files');
  }
}

export function verifySharedChatIsNotExpired(sharedEntity: { expiredAt: Date }): void {
  if (sharedEntity.expiredAt < new Date()) {
    throw new ForbiddenError('Shared chat has expired');
  }
}

export function verifySharedChatIsNotDeleted(sharedEntity: { isDeleted: boolean }): void {
  if (sharedEntity.isDeleted) {
    throw new ForbiddenError('Shared chat has been deleted');
  }
}

export function verifySharedChatIsNotSuspended(sharedEntity: { suspended: boolean }): void {
  if (sharedEntity.suspended) {
    throw new ForbiddenError('Shared chat has been suspended');
  }
}

export function verifySharedChatCanBeAccessed(sharedEntity: {
  expiredAt: Date;
  isDeleted: boolean;
  suspended: boolean;
}): void {
  verifySharedChatIsNotExpired(sharedEntity);
  verifySharedChatIsNotDeleted(sharedEntity);
  verifySharedChatIsNotSuspended(sharedEntity);
}
