import { getUserAndContextByUserId } from '@/auth/utils';
import { getFileExtension, isImageFile } from '@/utils/files/generic';
import { cnanoid } from '@ais-chat/shared/random/randomService';
import { dbInsertFileWithChunks } from '@shared/db/functions/files';
import { dbGetCharacterByIdAndInviteCode } from '@shared/db/functions/character';
import { dbGetLearningScenarioByIdAndInviteCode } from '@shared/db/functions/learning-scenario';
import { uploadMessageAttachment } from '@shared/files/fileService';
import { ForbiddenError, InvalidArgumentError, NotFoundError } from '@shared/error';
import { chunkAndEmbed } from '../rag/rag-service';
import { fileExtractionXberg } from '../file-extraction/file-extraction-xberg';
import { preprocessImage } from '../file-operations/preprocess-image';

type SharedUploadContext = {
  startedBy: string;
  federalStateId: string;
  inviteCode: string;
  entityType: 'character' | 'learningScenario';
  entityId: string;
};

/** This object is stored in the metadata column of the files table  */
export type SharedChatOwnershipMetadata = {
  sharedChatInviteCode: string;
  sharedChatEntityType: 'character' | 'learningScenario';
  sharedChatEntityId: string;
  sharedChatSessionId: string;
};

type ObjectMetadata = Record<string, unknown>;

function toObjectMetadata(metadata: unknown): ObjectMetadata {
  if (metadata !== null && typeof metadata === 'object') {
    return metadata as ObjectMetadata;
  }
  return {};
}

export function buildSharedChatOwnershipMetadata({
  existingMetadata,
  context,
  sharedSessionId,
}: {
  existingMetadata: unknown;
  context: SharedUploadContext;
  sharedSessionId: string;
}): ObjectMetadata {
  return {
    ...toObjectMetadata(existingMetadata),
    sharedChatInviteCode: context.inviteCode,
    sharedChatEntityType: context.entityType,
    sharedChatEntityId: context.entityId,
    sharedChatSessionId: sharedSessionId,
  };
}

export function isSharedChatFileOwnedBySession({
  metadata,
  context,
  sharedSessionId,
}: {
  metadata: unknown;
  context: Pick<SharedUploadContext, 'inviteCode' | 'entityType' | 'entityId'>;
  sharedSessionId: string;
}): boolean {
  const meta = toObjectMetadata(metadata) as Partial<SharedChatOwnershipMetadata>;

  return (
    meta.sharedChatInviteCode === context.inviteCode &&
    meta.sharedChatEntityType === context.entityType &&
    meta.sharedChatEntityId === context.entityId &&
    meta.sharedChatSessionId === sharedSessionId
  );
}

export function assertSharedChatFileOwnershipBySession(args: {
  metadata: unknown;
  context: Pick<SharedUploadContext, 'inviteCode' | 'entityType' | 'entityId'>;
  sharedSessionId: string;
}): void {
  if (!isSharedChatFileOwnedBySession(args)) {
    throw new ForbiddenError('Not authorized to access this file');
  }
}

export async function resolveSharedUploadContext({
  inviteCode,
  characterId,
  learningScenarioId,
}: {
  inviteCode: string;
  characterId?: string;
  learningScenarioId?: string;
}): Promise<SharedUploadContext> {
  if (
    (characterId === undefined && learningScenarioId === undefined) ||
    (characterId !== undefined && learningScenarioId !== undefined)
  ) {
    throw new InvalidArgumentError('Exactly one of characterId or learningScenarioId is required.');
  }

  let sharedEntity:
    | Awaited<ReturnType<typeof dbGetCharacterByIdAndInviteCode>>
    | Awaited<ReturnType<typeof dbGetLearningScenarioByIdAndInviteCode>>;

  if (characterId !== undefined) {
    sharedEntity = await dbGetCharacterByIdAndInviteCode({
      id: characterId,
      inviteCode,
    });
  } else {
    sharedEntity = await dbGetLearningScenarioByIdAndInviteCode({
      learningScenarioId: learningScenarioId!,
      inviteCode,
    });
  }

  if (sharedEntity === undefined || sharedEntity.startedBy === null) {
    throw new NotFoundError('Shared chat not found');
  }

  const teacher = await getUserAndContextByUserId({ userId: sharedEntity.startedBy });

  return {
    startedBy: sharedEntity.startedBy,
    federalStateId: teacher.federalState.id,
    inviteCode,
    entityType: characterId !== undefined ? 'character' : 'learningScenario',
    entityId: characterId ?? learningScenarioId!,
  };
}

/**
 * Uploads a file for a shared (invite-based) chat.
 * Files are stored with `userId: null` and are later authorized through invite/session logic.
 */
export async function uploadSharedChatFile({
  file,
  inviteCode,
  characterId,
  learningScenarioId,
  sharedSessionId,
}: {
  file: File;
  inviteCode: string;
  characterId?: string;
  learningScenarioId?: string;
  sharedSessionId: string;
}): Promise<string> {
  if (sharedSessionId.trim() === '') {
    throw new InvalidArgumentError('sharedSessionId is required');
  }

  const context = await resolveSharedUploadContext({
    inviteCode,
    characterId,
    learningScenarioId,
  });

  const fileId = `file_${cnanoid()}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileExtension = getFileExtension(file.name);

  if (isImageFile(fileExtension)) {
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
          existingMetadata: metadata,
          context,
          sharedSessionId,
        }),
        userId: null,
      },
      [],
    );

    return fileId;
  }

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
        existingMetadata: {},
        context,
        sharedSessionId,
      }),
      userId: null,
    },
    chunks,
  );

  return fileId;
}
