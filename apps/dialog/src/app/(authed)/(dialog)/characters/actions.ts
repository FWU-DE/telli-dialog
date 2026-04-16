'use server';

import { requireAuth } from '@/auth/requireAuth';
import {
  createNewCharacter,
  downloadFileFromCharacter,
} from '@shared/characters/character-service';
import { runServerAction } from '@shared/actions/run-server-action';

export async function createNewCharacterAction({
  modelId,
  templatePictureId,
  templateId,
  duplicateCharacterName,
}: {
  modelId?: string;
  templatePictureId?: string;
  templateId?: string;
  duplicateCharacterName?: string;
}) {
  const { user, school, federalState } = await requireAuth();

  return runServerAction(createNewCharacter)({
    federalStateId: federalState.id,
    modelId: modelId,
    schoolId: school.id,
    user,
    templatePictureId,
    templateId,
    duplicateCharacterName,
  });
}

export async function downloadFileFromCharacterAction({
  characterId,
  fileId,
}: {
  characterId: string;
  fileId: string;
}) {
  const { user, school } = await requireAuth();

  return runServerAction(downloadFileFromCharacter)({
    characterId,
    fileId,
    schoolId: school.id,
    user,
  });
}
