'use server';

import { db } from '@/db';
import { CharacterFileMapping, characterTable, FileModel, fileTable } from '@/db/schema';
import { getUser } from '@/auth/utils';
import { dbGetAndUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';
import { copyFileInS3 } from '@/s3';
import { generateUUID } from '@/utils/uuid';
import { eq } from 'drizzle-orm';
import { dbGetRelatedCharacterFiles, dbGetRelatedSharedChatFiles } from '@/db/functions/files';

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
  let copyOfTemplatePicture;
  if (templatePictureId !== undefined) {
    copyOfTemplatePicture = `characters/${characterId}/avatar`;
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
export async function deleteFileMappingAndEntity({ fileId }: { fileId: string }) {
  const user = await getUser();
  await db.delete(CharacterFileMapping).where(eq(CharacterFileMapping.fileId, fileId)),
    await db.delete(fileTable).where(eq(fileTable.id, fileId));
}

export async function fetchFileMapping(id: string): Promise<FileModel[]> {
  const user = await getUser();
  if (user === undefined) return [];
  return await dbGetRelatedCharacterFiles(id);
}

export async function linkFileToCharacter({
  fileId,
  characterId,
}: {
  fileId: string;
  characterId: string;
}) {
  const user = await getUser();
  const [insertedFileMapping] = await db
    .insert(CharacterFileMapping)
    .values({ characterId: characterId, fileId: fileId })
    .returning();
  if (insertedFileMapping === undefined) {
    throw new Error('Could not Link file to character');
  }
}
