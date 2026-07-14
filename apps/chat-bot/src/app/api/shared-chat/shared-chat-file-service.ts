import { type ChatMessage } from '@/types/chat';
import { dbGetFilesInIds } from '@shared/db/functions/files';
import { resolveSharedChatEntityContext } from './shared-chat-upload-service';
import { SharedMessageFileModel, SharedSessionId, verify } from '.';
import { verifySharedSessionIdIsNotEmpty } from './shared-chat-verify';

function getLastUserMessageId(messages: ChatMessage[]): string | undefined {
  return messages.findLast((message) => message.role === 'user')?.id;
}

/**
 * Combines entity-related files with files uploaded for the current shared chat turn.
 * Uploaded files are associated with the most recent user message so downstream
 * image attachment enrichment can attach them to the right message.
 */
export async function combineSharedRelatedFiles({
  relatedFileEntities,
  messages,
  fileIds,
  inviteCode,
  entityType,
  entityId,
  sharedSessionId,
}: {
  relatedFileEntities: SharedMessageFileModel[];
  messages: ChatMessage[];
  fileIds?: string[];
  inviteCode: string;
  entityType: 'character' | 'learningScenario';
  entityId: string;
  sharedSessionId?: SharedSessionId;
}): Promise<SharedMessageFileModel[]> {
  if (fileIds === undefined || fileIds.length === 0) {
    return relatedFileEntities;
  }

  verifySharedSessionIdIsNotEmpty(sharedSessionId);

  const lastUserMessageId = getLastUserMessageId(messages);
  if (lastUserMessageId === undefined) {
    return relatedFileEntities;
  }

  const context = await resolveSharedChatEntityContext({
    inviteCode,
    entityType,
    entityId,
  });

  const uploadedFiles = await dbGetFilesInIds(fileIds);
  verify.filesDoNotBelongToAnyUser(uploadedFiles);
  verify.sharedChatFileOwnershipBySession(uploadedFiles, context, sharedSessionId);

  const uploadedFilesWithMessageId: SharedMessageFileModel[] = uploadedFiles.map((file) => ({
    ...file,
    conversationMessageId: lastUserMessageId,
  }));

  // Keep stable order and avoid duplicates if an uploaded file also exists in related files.
  const byId = new Map<string, SharedMessageFileModel>();

  for (const file of relatedFileEntities) {
    byId.set(file.id, file);
  }

  for (const file of uploadedFilesWithMessageId) {
    byId.set(file.id, file);
  }

  return [...byId.values()];
}
