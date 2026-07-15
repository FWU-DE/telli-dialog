import { type ChatMessage } from '@/types/chat';
import { dbGetFilesInIds } from '@shared/db/functions/files';
import { SharedSessionId, verify } from '.';
import { verifySharedSessionIdIsNotEmpty } from './shared-chat-verify';
import { FileModel } from '@shared/db/schema';

/**
 * Combines entity-related files with files uploaded for the current shared chat turn.
 * Uploaded files are associated with the most recent user message so downstream
 * image attachment enrichment can attach them to the right message.
 */
export async function combineSharedRelatedFiles({
  relatedFileEntities,
  fileIds,
  inviteCode,
  entityType,
  entityId,
  sharedSessionId,
}: {
  relatedFileEntities: FileModel[];
  fileIds?: string[];
  inviteCode: string;
  entityType: 'character' | 'learningScenario';
  entityId: string;
  sharedSessionId?: SharedSessionId;
}): Promise<FileModel[]> {
  if (fileIds === undefined || fileIds.length === 0) {
    return relatedFileEntities;
  }

  verifySharedSessionIdIsNotEmpty(sharedSessionId);

  const uploadedFiles = await dbGetFilesInIds(fileIds);
  verify.filesDoNotBelongToAnyUser(uploadedFiles);
  verify.sharedChatFileOwnershipBySession({
    files: uploadedFiles,
    inviteCode,
    entityType,
    entityId,
    sharedSessionId,
  });

  return [...relatedFileEntities, ...uploadedFiles];
}
