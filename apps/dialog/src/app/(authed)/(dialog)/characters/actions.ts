'use server';

import { requireAuth } from '@/auth/requireAuth';
import {
  createNewCharacter,
  deleteFileMappingAndEntity,
  fetchFileMappings,
  linkFileToCharacter,
} from '@shared/characters/character-service';
import { runServerAction } from '@shared/actions/run-server-action';

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

  // Todo RL: use runServerAction here as soon as we have adapter custom gpt service
  return createNewCharacter({
    federalStateId: federalState.id,
    modelId: modelId,
    schoolId: school.id,
    user,
    templatePictureId,
    templateId,
  });
}

export async function deleteFileMappingAndEntityAction({
  characterId,
  fileId,
}: {
  characterId: string;
  fileId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(deleteFileMappingAndEntity)({
    characterId,
    fileId,
    userId: user.id,
  });
}

export async function linkFileToCharacterAction({
  fileId,
  characterId,
}: {
  fileId: string;
  characterId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(linkFileToCharacter)({ fileId, characterId, userId: user.id });
}
