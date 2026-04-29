'use server';

import { requireAuth } from '@/auth/requireAuth';
import {
  createNewCharacter,
  downloadFileFromCharacter,
} from '@shared/characters/character-service';
import { runServerAction } from '@shared/actions/run-server-action';

export async function createNewCharacterAction({
  modelId,
  templateId,
  duplicateCharacterName,
}: {
  modelId?: string;
  templateId?: string;
  duplicateCharacterName?: string;
}) {
  const { user, federalState } = await requireAuth();

  // Todo: Will be implemented in TD-701
  return runServerAction(createNewCharacter)({
    federalStateId: federalState.id,
    modelId: modelId,
    schoolId: user.schoolIds?.[0] ?? '',
    user,
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
  const { user } = await requireAuth();

  return runServerAction(downloadFileFromCharacter)({
    characterId,
    fileId,
    schoolIds: user.schoolIds ?? [],
    user,
  });
}
