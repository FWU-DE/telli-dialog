import { dbGetFilesInIds } from '@shared/db/functions/files';
import { ForbiddenError, NotFoundError } from '@shared/error';
import { getReadOnlySignedUrl } from '@shared/s3';
import {
  assertSharedChatFileOwnershipBySession,
  resolveSharedUploadContext,
} from './shared-chat-upload-service';

export async function getSharedChatReadOnlySignedUrl({
  inviteCode,
  entityType,
  entityId,
  fileId,
  sharedSessionId,
}: {
  inviteCode: string;
  entityType: 'character' | 'learningScenario';
  entityId: string;
  fileId: string;
  sharedSessionId: string;
}): Promise<string> {
  if (sharedSessionId.trim() === '') {
    throw new ForbiddenError('Not authorized to access this file');
  }

  // Validate invite + target entity first.
  const context = await resolveSharedUploadContext({
    inviteCode,
    entityType,
    entityId,
  });

  const files = await dbGetFilesInIds([fileId]);
  const file = files[0];

  if (file === undefined) {
    throw new NotFoundError('File not found');
  }

  // Shared upload path stores anonymous files with null userId.
  if (file.userId !== null) {
    throw new ForbiddenError('Not authorized to access this file');
  }

  assertSharedChatFileOwnershipBySession({
    metadata: file.metadata,
    context,
    sharedSessionId,
  });

  return getReadOnlySignedUrl({ key: `message_attachments/${file.id}` });
}
