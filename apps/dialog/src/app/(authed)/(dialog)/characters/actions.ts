'use server';

import { requireAuth } from '@/auth/requireAuth';
import { createNewCharacter } from '@shared/characters/character-service';
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

  return runServerAction(createNewCharacter)({
    federalStateId: federalState.id,
    modelId: modelId,
    schoolId: school.id,
    user,
    templatePictureId,
    templateId,
  });
}
