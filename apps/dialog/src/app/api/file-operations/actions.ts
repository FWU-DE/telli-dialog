'use server';

import { requireAuth } from '@/auth/requireAuth';
import { dbVerifyFileOwnership, dbGetFilesForLearningScenario, dbGetRelatedCharacterFiles } from '@shared/db/functions/files';
import { ForbiddenError, NotFoundError } from '@shared/error';
import { getReadOnlySignedUrl } from '@shared/s3';
import { ONE_HOUR } from '@shared/s3/const';
import { getAssistantByUser } from '@shared/assistants/assistant-service';
import { dbGetCharacterByIdWithShareData } from '@shared/db/functions/character';
import { dbGetLearningScenarioByIdOptionalShareData } from '@shared/db/functions/learning-scenario';
import { verifyReadAccess } from '@shared/auth/authorization-service';
import { FileModel } from '@shared/db/schema';

const MESSAGE_ATTACHMENTS_PREFIX = 'message_attachments/';

export type KnowledgeFileEntityType = 'assistant' | 'character' | 'learningScenario';

export async function getReadOnlySignedUrlAction({
  key,
  filename,
  contentType,
  attachment,
  options,
}: {
  key: string | null | undefined;
  filename?: string;
  contentType?: string;
  attachment?: boolean;
  options?: { expiresIn?: number };
}) {
  const { user } = await requireAuth();

  if (key && key.startsWith(MESSAGE_ATTACHMENTS_PREFIX)) {
    const fileId = key.slice(MESSAGE_ATTACHMENTS_PREFIX.length);
    const isOwner = await dbVerifyFileOwnership({ fileId, userId: user.id });
    if (!isOwner) {
      throw new ForbiddenError('Not authorized to access this file');
    }
  } else if (key) {
    // Only message_attachments keys are allowed from client actions
    throw new ForbiddenError('Not authorized to access this resource');
  }

  return getReadOnlySignedUrl({ key, filename, contentType, attachment, options });
}

export async function downloadKnowledgeFileAction({
  entityType,
  entityId,
  fileId,
}: {
  entityType: KnowledgeFileEntityType;
  entityId: string;
  fileId: string;
}) {
  const { user, school } = await requireAuth();

  let entityFiles: FileModel[];

  switch (entityType) {
    case 'assistant': {
      const { fileMappings } = await getAssistantByUser({
        assistantId: entityId,
        schoolId: school.id,
        userId: user.id,
      });
      entityFiles = fileMappings;
      break;
    }
    case 'character': {
      const character = await dbGetCharacterByIdWithShareData({
        characterId: entityId,
        userId: user.id,
      });
      if (!character) throw new NotFoundError('Character not found');
      verifyReadAccess({ item: character, schoolId: school.id, userId: user.id });
      entityFiles = await dbGetRelatedCharacterFiles(entityId);
      break;
    }
    case 'learningScenario': {
      const learningScenario = await dbGetLearningScenarioByIdOptionalShareData({
        learningScenarioId: entityId,
        userId: user.id,
      });
      if (!learningScenario) throw new NotFoundError('Learning scenario not found');
      verifyReadAccess({ item: learningScenario, schoolId: school.id, userId: user.id });
      entityFiles = await dbGetFilesForLearningScenario(entityId);
      break;
    }
    default:
      throw new ForbiddenError('Unreachable: invalid entity type');
  }

  const file = entityFiles.find((f) => f.id === fileId);
  if (!file) throw new ForbiddenError('Not authorized to access this file');

  return getReadOnlySignedUrl({
    key: `${MESSAGE_ATTACHMENTS_PREFIX}${fileId}`,
    filename: file.name,
    attachment: true,
    options: { expiresIn: ONE_HOUR },
  });
}

