import { type ChatMessage } from '@/types/chat';
import { type FileModel } from '@shared/db/schema';
import { dbGetFilesInIds } from '@shared/db/functions/files';
import { ForbiddenError } from '@shared/error';
import {
  assertSharedChatFileOwnershipBySession,
  resolveSharedUploadContext,
} from './shared-chat-upload-service';

type SharedMessageFileModel = FileModel & { conversationMessageId?: string };

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
  characterId,
  learningScenarioId,
  sharedSessionId,
}: {
  relatedFileEntities: SharedMessageFileModel[];
  messages: ChatMessage[];
  fileIds?: string[];
  inviteCode: string;
  characterId?: string;
  learningScenarioId?: string;
  sharedSessionId?: string;
}): Promise<SharedMessageFileModel[]> {
  if (fileIds === undefined || fileIds.length === 0) {
    return relatedFileEntities;
  }

  if (sharedSessionId === undefined || sharedSessionId.trim() === '') {
    throw new ForbiddenError('Not authorized to use uploaded files');
  }

  const lastUserMessageId = getLastUserMessageId(messages);
  if (lastUserMessageId === undefined) {
    return relatedFileEntities;
  }

  const context = await resolveSharedUploadContext({
    inviteCode,
    characterId,
    learningScenarioId,
  });

  const uploadedFiles = await dbGetFilesInIds(fileIds);

  for (const file of uploadedFiles) {
    if (file.userId !== null) {
      throw new ForbiddenError('Not authorized to use one or more files');
    }

    assertSharedChatFileOwnershipBySession({
      metadata: file.metadata,
      context,
      sharedSessionId,
    });
  }

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
