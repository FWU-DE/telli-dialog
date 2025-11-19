'use server';

import { FileModel } from '@shared/db/schema';
import { requireAuth } from '@/auth/requireAuth';
import {
  createNewCharacter,
  deleteFileMappingAndEntity,
  fetchFileMappings,
  linkFileToCharacter,
} from '@shared/characters/character-service';
import { withLoggingAsync } from '@shared/logging';

export async function createNewCharacterAction({
  modelId,
  templatePictureId,
  templateId,
}: {
  modelId?: string;
  templatePictureId?: string;
  templateId?: string;
}) {
  const { user, school, federalState } = await requireAuth();

  return await withLoggingAsync(createNewCharacter)({
    federalStateId: federalState.id,
    modelId: modelId,
    schoolId: school.id,
    user,
    templatePictureId,
    templateId,
  });
}

export async function deleteFileMappingAndEntityAction({ fileId }: { fileId: string }) {
  const { user } = await requireAuth();

  return await withLoggingAsync(deleteFileMappingAndEntity)({ fileId });
}

export async function fetchFileMappingAction(conversationId: string): Promise<FileModel[]> {
  const { user } = await requireAuth();

  return await withLoggingAsync(fetchFileMappings)(conversationId, user.id);
}

export async function linkFileToCharacterAction({
  fileId,
  characterId,
}: {
  fileId: string;
  characterId: string;
}) {
  const { user } = await requireAuth();

  return await withLoggingAsync(linkFileToCharacter)({ fileId, characterId });
}
