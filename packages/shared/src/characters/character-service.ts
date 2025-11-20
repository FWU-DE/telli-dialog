import { db } from '@shared/db';
import { dbDeleteCharacterByIdAndUserId, dbGetCharacterById } from '@shared/db/functions/character';
import { dbGetRelatedCharacterFiles } from '@shared/db/functions/files';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import {
  CharacterAccessLevel,
  CharacterFileMapping,
  characterTable,
  characterUpdateSchema,
  FileModel,
  fileTable,
  UserModel,
} from '@shared/db/schema';
import { ForbiddenError } from '@shared/error';
import { logError } from '@shared/logging';
import { copyFileInS3, deleteFileFromS3 } from '@shared/s3';
import { copyCharacter, copyRelatedTemplateFiles } from '@shared/services/templateService';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { generateUUID } from '@shared/utils/uuid';
import { and, eq } from 'drizzle-orm';
import z from 'zod';

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

  const [insertedCharacter] = await db
    .insert(characterTable)
    .values({
      id: characterId,
      name: '',
      userId: user.id,
      schoolId: schoolId,
      modelId: model.id,
      pictureId: copyOfTemplatePicture,
    })
    .returning();

  if (insertedCharacter === undefined) {
    throw new Error('Could not create a new character');
  }

  return insertedCharacter;
}

/**
 * Deletes a character file mapping and the associated file entry in database.
 */
export async function deleteFileMappingAndEntity({
  characterId,
  fileId,
  userId,
}: {
  characterId: string;
  fileId: string;
  userId: string;
}) {
  // Authorization check: user must own character
  if ((await isUserOwnerOfCharacter(characterId, userId)) === false)
    throw new ForbiddenError('Not authorized to delete this file mapping');

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
  // Authorization check: user must own character
  if ((await isUserOwnerOfCharacter(characterId, userId)) === false)
    throw new ForbiddenError('Not authorized to fetch file mappings for this character');

  // Fetch and return related files
  return await dbGetRelatedCharacterFiles(characterId);
}

/**
 * Links a file to a character by creating a new CharacterFileMapping entry in the database.
 */
export async function linkFileToCharacter({
  fileId,
  characterId,
  userId,
}: {
  fileId: string;
  characterId: string;
  userId: string;
}) {
  // Authorization check: user must own character
  if ((await isUserOwnerOfCharacter(characterId, userId)) === false)
    throw new ForbiddenError('Not authorized to add new file for this character');

  const [insertedFileMapping] = await db
    .insert(CharacterFileMapping)
    .values({ characterId: characterId, fileId: fileId })
    .returning();
  if (insertedFileMapping === undefined) {
    throw new Error('Could not link file to character');
  }
}

/**
 * User can share character with school (access level = school)
 * or unshare it (access level = private).
 * Setting the access level to global is not allowed here.
 */
export async function updateCharacterAccessLevel({
  characterId,
  accessLevel,
  userId,
}: {
  characterId: string;
  accessLevel: CharacterAccessLevel;
  userId: string;
}) {
  // Authorization check: user must own character
  if ((await isUserOwnerOfCharacter(characterId, userId)) === false)
    throw new ForbiddenError('Not authorized to set the access level of this character');

  if (accessLevel === 'global') {
    throw new ForbiddenError('Not authorized to set the access level to global');
  }

  // Update the access level in database
  const updatedCharacter = (
    await db
      .update(characterTable)
      .set({ accessLevel })
      .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, userId)))
      .returning()
  )[0];

  if (updatedCharacter === undefined) {
    throw Error('Could not update the access level of the character');
  }

  return updatedCharacter;
}

/**
 * Updates the picture of a character by setting a new picture path.
 */
export async function updateCharacterPicture({
  characterId,
  picturePath,
  userId,
}: {
  characterId: string;
  picturePath: string;
  userId: string;
}) {
  // Authorization check: user must own character
  if ((await isUserOwnerOfCharacter(characterId, userId)) === false)
    throw new ForbiddenError('Not authorized to update the picture of this character');
  const updatedCharacter = (
    await db
      .update(characterTable)
      .set({ pictureId: picturePath })
      .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, userId)))
      .returning()
  )[0];

  if (updatedCharacter === undefined) {
    throw Error('Could not update the picture of the character');
  }

  return updatedCharacter;
}

const updateCharacterActionSchema = characterUpdateSchema.omit({
  accessLevel: true,
  inviteCode: true,
  isDeleted: true,
  originalCharacterId: true,
  pictureId: true,
  schoolId: true,
  startedAt: true,
});
export type UpdateCharacterActionModel = z.infer<typeof updateCharacterActionSchema>;

/**
 * Updates character details that are allowed to be changed by the user.
 */
export async function updateCharacter({
  characterId,
  userId,
  ...character
}: UpdateCharacterActionModel & { characterId: string; userId: string }) {
  // Authorization check: user must own character
  if ((await isUserOwnerOfCharacter(characterId, userId)) === false)
    throw new ForbiddenError('Not authorized to update the picture of this character');

  const cleanedCharacter = removeNullishValues(character);
  if (cleanedCharacter === undefined) return;

  const parsedCharacterValues = updateCharacterActionSchema.parse(cleanedCharacter);

  const [updatedCharacter] = await db
    .update(characterTable)
    .set({ ...parsedCharacterValues })
    .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, userId)))
    .returning();

  if (updatedCharacter === undefined) {
    throw Error('Could not update the character');
  }
  return updatedCharacter;
}

/**
 * Deletes a character and its associated picture from S3.
 */
export async function deleteCharacter({
  characterId,
  pictureId,
  userId,
}: {
  characterId: string;
  pictureId?: string;
  userId: string;
}) {
  // Authorization check: user must own character
  if ((await isUserOwnerOfCharacter(characterId, userId)) === false)
    throw new ForbiddenError('Not authorized to delete this character');

  // delete character from db
  const deletedCharacter = await dbDeleteCharacterByIdAndUserId({ characterId, userId: userId });

  const maybePictureId = deletedCharacter.pictureId ?? pictureId;
  if (maybePictureId !== null && maybePictureId !== undefined) {
    try {
      await deleteFileFromS3({ key: maybePictureId });
    } catch (error) {
      logError('Cannot delete picture of character ' + characterId, error);
    }
  }

  return deletedCharacter;
}

/**
 * Loads character from db and checks if the user is the owner.
 */
export async function isUserOwnerOfCharacter(
  characterId: string,
  userId: string,
): Promise<boolean> {
  const character = await dbGetCharacterById({ characterId });
  return character?.userId === userId;
}
