import { getUserAndContextByUserId } from '@/auth/utils';
import { getFileExtension, isImageFile } from '@/utils/files/generic';
import { cnanoid } from '@ais-chat/shared/random/randomService';
import { dbInsertFileWithChunks } from '@shared/db/functions/files';
import { dbGetCharacterByIdAndInviteCode } from '@shared/db/functions/character';
import { dbGetLearningScenarioByIdAndInviteCode } from '@shared/db/functions/learning-scenario';
import { uploadMessageAttachment } from '@shared/files/fileService';
import { InvalidArgumentError, NotFoundError } from '@shared/error';
import { chunkAndEmbed } from '../rag/rag-service';
import { fileExtractionXberg } from '../file-extraction/file-extraction-xberg';
import { preprocessImage } from '../file-operations/preprocess-image';
import { SharedChatFileMetadata, SharedEntityContext, SharedSessionId, verify } from '.';

export function buildSharedChatOwnershipMetadata({
  existingFileMetadata,
  context,
  sharedSessionId,
}: {
  existingFileMetadata: Record<string, unknown>;
  context: SharedEntityContext;
  sharedSessionId: string;
}): SharedChatFileMetadata {
  return {
    ...existingFileMetadata,
    sharedChatSessionId: sharedSessionId,
    sharedChatInviteCode: context.inviteCode,
    sharedChatEntityType: context.entityType,
    sharedChatEntityId: context.entityId,
  };
}

async function uploadSharedChatImageFile({
  fileId,
  file,
  fileExtension,
  buffer,
  context,
  sharedSessionId,
}: {
  fileId: string;
  file: File;
  fileExtension: string;
  buffer: Buffer;
  context: SharedEntityContext;
  sharedSessionId: SharedSessionId;
}): Promise<string> {
  const {
    buffer: imageBuffer,
    metadata,
    type: processedType,
  } = await preprocessImage(buffer, fileExtension);

  const processedName =
    processedType === fileExtension
      ? file.name
      : `${file.name.replace(/\.[^.]+$/, '')}.${processedType}`;

  await uploadMessageAttachment({ fileId, fileExtension: processedType, buffer: imageBuffer });
  await dbInsertFileWithChunks(
    {
      id: fileId,
      name: processedName,
      size: imageBuffer.length,
      type: processedType,
      metadata: buildSharedChatOwnershipMetadata({
        existingFileMetadata: metadata,
        context,
        sharedSessionId,
      }),
      userId: null,
    },
    [],
  );

  return fileId;
}

async function uploadSharedChatDocumentFile({
  fileId,
  file,
  fileExtension,
  buffer,
  context,
  sharedSessionId,
}: {
  fileId: string;
  file: File;
  fileExtension: string;
  buffer: Buffer;
  context: SharedEntityContext;
  sharedSessionId: SharedSessionId;
}): Promise<string> {
  const content = await fileExtractionXberg({ buffer, filename: file.name });

  const [chunks] = await Promise.all([
    chunkAndEmbed({ text: content, fileId, federalStateId: context.federalStateId }),
    uploadMessageAttachment({ fileId, fileExtension, buffer }),
  ]);

  await dbInsertFileWithChunks(
    {
      id: fileId,
      name: file.name,
      size: file.size,
      type: fileExtension,
      metadata: buildSharedChatOwnershipMetadata({
        existingFileMetadata: {},
        context,
        sharedSessionId,
      }),
      userId: null,
    },
    chunks,
  );

  return fileId;
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

  const fileId = `file_${cnanoid()}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileExtension = getFileExtension(file.name);

  if (isImageFile(fileExtension)) {
    return uploadSharedChatImageFile({
      fileId,
      file,
      fileExtension,
      buffer,
      context,
      sharedSessionId,
    });
  }

  return uploadSharedChatDocumentFile({
    fileId,
    file,
    fileExtension,
    buffer,
    context,
    sharedSessionId,
  });
}
