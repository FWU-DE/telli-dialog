'use server';

import { db } from '@/db';
import { characterTable } from '@/db/schema';
import { getUser } from '@/auth/utils';
import { dbGetAndUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';
import { copyFileInS3 } from '@/s3';
import { generateUUID } from '@/utils/uuid';

export async function createNewCharacterAction({
  modelId: _modelId,
  templatePictureId,
}: {
  modelId?: string;
  templatePictureId?: string;
}) {
  const user = await getUser();

  // Generate uuid before hand to avoid two db transactions for create and imediate update
  const characterId = generateUUID();
  const copyOfTemplatePicture = `characters/${characterId}/avatar`;

  if (templatePictureId !== undefined) {
    await copyFileInS3({
      newKey: copyOfTemplatePicture,
      copySource: templatePictureId,
    });
  }
  const llmModels = await dbGetAndUpdateLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  const model = llmModels.find((m) => m.id === _modelId) ?? llmModels[0];

  if (model === undefined) {
    throw Error('Could not find any model');
  }

  const insertedCharacter = (
    await db
      .insert(characterTable)
      .values({
        id: characterId,
        name: '',
        userId: user.id,
        schoolId: user.school?.id ?? null,
        modelId: model.id,
        pictureId: copyOfTemplatePicture,
      })
      .returning()
  )[0];

  if (insertedCharacter === undefined) {
    throw Error('Could not create a new character');
  }

  return insertedCharacter;
}
