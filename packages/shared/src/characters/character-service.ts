import { db } from '@shared/db';
import { dbGetRelatedCharacterFiles } from '@shared/db/functions/files';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import {
  CharacterFileMapping,
  characterTable,
  FileModel,
  fileTable,
  UserModel,
} from '@shared/db/schema';
import { copyFileInS3 } from '@shared/s3';
import { copyCharacter, copyRelatedTemplateFiles } from '@shared/services/templateService';
import { generateUUID } from '@shared/utils/uuid';
import { eq } from 'drizzle-orm';

/**
 * Creates a new character for a user, optionally based on a template.
 */
export async function createNewCharacter({
  federalStateId,
  modelId: _modelId,
  schoolId,
  user,
  templatePictureId,
  templateId,
}: {
  federalStateId: string;
  modelId?: string;
  schoolId: string;
  user: UserModel;
  templatePictureId?: string;
  templateId?: string;
}) {
  if (templateId !== undefined) {
    let insertedCharacter = await copyCharacter(templateId, 'private', user.id, schoolId);

    if (templatePictureId !== undefined) {
      const copyOfTemplatePicture = `characters/${insertedCharacter.id}/avatar`;
      await copyFileInS3({
        newKey: copyOfTemplatePicture,
        copySource: templatePictureId,
      });

      // Update the character with the new picture
      const [updatedCharacter] = await db
        .update(characterTable)
        .set({ pictureId: copyOfTemplatePicture })
        .where(eq(characterTable.id, insertedCharacter.id))
        .returning();

      if (updatedCharacter) {
        insertedCharacter = updatedCharacter;
      }
    }

    await copyRelatedTemplateFiles('character', templateId, insertedCharacter.id);
    return insertedCharacter;
  }

  // Generate uuid before hand to avoid two db transactions for create and immediate update
  const characterId = generateUUID();
  let copyOfTemplatePicture;
  if (templatePictureId !== undefined) {
    copyOfTemplatePicture = `characters/${characterId}/avatar`;
    await copyFileInS3({
      newKey: copyOfTemplatePicture,
      copySource: templatePictureId,
    });
  }
  const llmModels = await dbGetLlmModelsByFederalStateId({
    federalStateId: federalStateId,
  });

  const model = llmModels.find((m) => m.id === _modelId) ?? llmModels[0];

  if (model === undefined) {
    throw new Error(
      `Could not find modelId ${_modelId} nor any other model for federalStateId ${federalStateId}`,
    );
  }

  const insertedCharacter = (
    await db
      .insert(characterTable)
      .values({
        id: characterId,
        name: '',
        userId: user.id,
        schoolId: schoolId,
        modelId: model.id,
        pictureId: copyOfTemplatePicture,
      })
      .returning()
  )[0];

  if (insertedCharacter === undefined) {
    throw new Error('Could not create a new character');
  }

  return insertedCharacter;
}

/**
 * Deletes a character file mapping and the associated file entry in database.
 */
export async function deleteFileMappingAndEntity({ fileId }: { fileId: string }) {
  // Todo Authorization check: user must own character

  // Delete the mapping and the file entry
  await db.transaction(async (tx) => {
    await tx.delete(CharacterFileMapping).where(eq(CharacterFileMapping.fileId, fileId));
    await tx.delete(fileTable).where(eq(fileTable.id, fileId));
  });
}

/**
 * Get all file mappings related to a character for a specific user.
 */
export async function fetchFileMappings(characterId: string, userId: string): Promise<FileModel[]> {
  // Todo Authorization check: user must own character
  return await dbGetRelatedCharacterFiles(characterId);
}

/**
 * Links a file to a character by creating a new CharacterFileMapping entry in the database.
 */
export async function linkFileToCharacter({
  fileId,
  characterId,
}: {
  fileId: string;
  characterId: string;
}) {
  // Todo Authorization check: user must own character
  const [insertedFileMapping] = await db
    .insert(CharacterFileMapping)
    .values({ characterId: characterId, fileId: fileId })
    .returning();
  if (insertedFileMapping === undefined) {
    throw new Error('Could not link file to character');
  }
}
