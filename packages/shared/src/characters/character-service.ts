import { UserModel } from '@shared/auth/user-model';
import { db } from '@shared/db';
import {
  dbDeleteCharacterByIdAndUserId,
  dbGetCharacterById,
  dbGetCharacterByIdWithShareData,
  dbGetCharacters,
  dbGetCharactersBySchoolId,
  dbGetCharactersByUserId,
  dbGetGlobalCharacters,
  dbGetSharedCharacterConversations,
} from '@shared/db/functions/character';
import { dbGetRelatedCharacterFiles } from '@shared/db/functions/files';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import {
  AccessLevel,
  CharacterFileMapping,
  CharacterSelectModel,
  CharacterWithShareDataModel,
  characterTable,
  characterUpdateSchema,
  FileModel,
  fileTable,
  sharedCharacterConversation,
  accessLevelSchema,
} from '@shared/db/schema';
import { checkParameterUUID, ForbiddenError } from '@shared/error';
import { NotFoundError } from '@shared/error/not-found-error';
import { deleteAvatarPicture, deleteMessageAttachment } from '@shared/files/fileService';
import { copyFileInS3, getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { generateInviteCode } from '@shared/sharing/generate-invite-code';
import { copyCharacter, copyRelatedTemplateFiles } from '@shared/templates/templateService';
import { addDays } from '@shared/utils/date';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { generateUUID } from '@shared/utils/uuid';
import { and, eq, lt } from 'drizzle-orm';
import z from 'zod';

/**
 * Creates a new character for a user, optionally based on a template.
 */
export const createNewCharacter = async ({
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
}) => {
  if (user.userRole !== 'teacher') throw new ForbiddenError('Not authorized to create a character');

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
};

/**
 * Deletes a character file mapping and the associated file entry in the database.
 * Also deletes the actual file from S3.
 */
export const deleteFileMappingAndEntity = async ({
  characterId,
  fileId,
  userId,
}: {
  characterId: string;
  fileId: string;
  userId: string;
}) => {
  checkParameterUUID(characterId);
  // Authorization check: user must own character
  const { isOwner } = await getCharacterInfo(characterId, userId);
  if (!isOwner) throw new ForbiddenError('Not authorized to delete this file mapping');

  // Delete the mapping and the file entry
  await db.transaction(async (tx) => {
    await tx.delete(CharacterFileMapping).where(eq(CharacterFileMapping.fileId, fileId));
    await tx.delete(fileTable).where(eq(fileTable.id, fileId));
  });

  // Delete the file from S3
  await deleteMessageAttachment({ fileId });
};

/**
 * Get all file mappings related to a character.
 *
 * If the character is private, only the owner can fetch file mappings.
 * If the character is released for a school, any teacher in that school can fetch file mappings.
 * If the character is global, any teacher can fetch those file mappings.
 */
export const fetchFileMappings = async ({
  characterId,
  userId,
  schoolId,
}: {
  characterId: string;
  userId: string;
  schoolId: string;
}): Promise<FileModel[]> => {
  checkParameterUUID(characterId);
  // Authorization check
  const { isOwner, isPrivate, character } = await getCharacterInfo(characterId, userId);
  if (
    (isPrivate && !isOwner) ||
    (!isOwner && character.accessLevel === 'school' && character.schoolId !== schoolId)
  )
    throw new ForbiddenError('Not authorized to fetch file mappings for this character');

  // Fetch and return related files
  return await dbGetRelatedCharacterFiles(characterId);
};

/**
 * Links a file to a character by creating a new CharacterFileMapping entry in the database.
 *
 * Only the owner is allowed to add new files to a character.
 */
export const linkFileToCharacter = async ({
  fileId,
  characterId,
  userId,
}: {
  fileId: string;
  characterId: string;
  userId: string;
}) => {
  checkParameterUUID(characterId);
  // Authorization check
  const { isOwner } = await getCharacterInfo(characterId, userId);
  if (!isOwner) throw new ForbiddenError('Not authorized to add new file for this character');

  // create a new file mapping
  const [insertedFileMapping] = await db
    .insert(CharacterFileMapping)
    .values({ characterId: characterId, fileId: fileId })
    .returning();
  if (insertedFileMapping === undefined) {
    throw new Error('Could not link file to character');
  }
};

/**
 * User can share a character he owns with the school (access level = school)
 * or unshare it (access level = private).
 * User is not allowed to set the access level to global.
 */
export const updateCharacterAccessLevel = async ({
  characterId,
  accessLevel,
  userId,
}: {
  characterId: string;
  accessLevel: AccessLevel;
  userId: string;
}) => {
  checkParameterUUID(characterId);
  accessLevelSchema.parse(accessLevel);

  // Authorization check
  if (accessLevel === 'global') {
    throw new ForbiddenError('Not authorized to set the access level to global');
  }

  const { isOwner } = await getCharacterInfo(characterId, userId);
  if (!isOwner)
    throw new ForbiddenError('Not authorized to set the access level of this character');

  // Update the access level in database
  const [updatedCharacter] = await db
    .update(characterTable)
    .set({ accessLevel })
    .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, userId)))
    .returning();

  if (updatedCharacter === undefined) {
    throw new Error('Could not update the access level of the character');
  }

  return updatedCharacter;
};

/**
 * Updates the picture of a character by setting a new picture path.
 *
 * Only the owner is allowed to update the picture.
 */
export const updateCharacterPicture = async ({
  characterId,
  picturePath,
  userId,
}: {
  characterId: string;
  picturePath: string;
  userId: string;
}) => {
  checkParameterUUID(characterId);
  // Authorization check
  const { isOwner } = await getCharacterInfo(characterId, userId);
  if (!isOwner) throw new ForbiddenError('Not authorized to update the picture of this character');

  // Update the picture path in database
  const [updatedCharacter] = await db
    .update(characterTable)
    .set({ pictureId: picturePath })
    .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, userId)))
    .returning();

  if (updatedCharacter === undefined) {
    throw new Error('Could not update the picture of the character');
  }

  return updatedCharacter;
};

/**
 * Schema for updating character details that are allowed to be changed by the user.
 */
const updateCharacterSchema = characterUpdateSchema.omit({
  accessLevel: true,
  isDeleted: true,
  originalCharacterId: true,
  pictureId: true,
  schoolId: true,
});
export type UpdateCharacterActionModel = z.infer<typeof updateCharacterSchema>;

/**
 * Updates character details that are allowed to be changed by user afterwards
 * The user must be the owner of the character.
 */
export const updateCharacter = async ({
  userId,
  ...character
}: UpdateCharacterActionModel & { userId: string }) => {
  checkParameterUUID(character.id);
  // Authorization check
  const { isOwner } = await getCharacterInfo(character.id, userId);
  if (!isOwner) throw new ForbiddenError('Not authorized to update this character');

  // Update the character in database
  const cleanedCharacter = removeNullishValues(character);
  if (cleanedCharacter === undefined) return;

  const parsedCharacterValues = updateCharacterSchema.parse(cleanedCharacter);

  const [updatedCharacter] = await db
    .update(characterTable)
    .set({ ...parsedCharacterValues })
    .where(and(eq(characterTable.id, character.id), eq(characterTable.userId, userId)))
    .returning();

  if (updatedCharacter === undefined) {
    throw new Error('Could not update the character');
  }
  return updatedCharacter;
};

/**
 * Deletes a character and its associated picture from S3.
 * Only the owner is allowed to delete the character.
 */
export const deleteCharacter = async ({
  characterId,
  userId,
}: {
  characterId: string;
  userId: string;
}) => {
  checkParameterUUID(characterId);
  // Authorization check
  const { isOwner, character } = await getCharacterInfo(characterId, userId);
  if (!isOwner) throw new ForbiddenError('Not authorized to delete this character');

  const relatedFiles = await dbGetRelatedCharacterFiles(characterId);

  // delete character from db
  const deletedCharacter = await dbDeleteCharacterByIdAndUserId({ characterId, userId: userId });

  // delete avatar picture from S3
  await deleteAvatarPicture(character.pictureId);

  // delete all related files linked to this character
  await Promise.allSettled(
    relatedFiles.map((file) => deleteMessageAttachment({ fileId: file.id })),
  );

  return deletedCharacter;
};

/**
 * A teacher can share a character with students.
 * The teacher can share his own characters or characters that are released for the school or global.
 */
export const shareCharacter = async ({
  characterId,
  user,
  telliPointsPercentageLimit,
  usageTimeLimitMinutes,
  schoolId,
}: {
  characterId: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
  telliPointsPercentageLimit: number;
  usageTimeLimitMinutes: number;
  schoolId?: string;
}) => {
  checkParameterUUID(characterId);
  // Authorization check: user must be a teacher and owner of the character or it is global
  if (user.userRole !== 'teacher') throw new ForbiddenError('Only a teacher can share a character');

  const { isOwner, isPrivate, character } = await getCharacterInfo(characterId, user.id);
  if (
    (isPrivate && !isOwner) ||
    (!isOwner && character.accessLevel === 'school' && character.schoolId !== schoolId)
  )
    throw new ForbiddenError('Not authorized to share this character');

  // validate input parameters
  if (telliPointsPercentageLimit < 0 || telliPointsPercentageLimit > 100) {
    throw new Error('telli points percentage limit must be between 0 and 100');
  }
  if (usageTimeLimitMinutes <= 0 || usageTimeLimitMinutes > 30 * 24 * 60) {
    throw new Error('usage time limit must be between 1 and 43200 minutes');
  }

  // share character instance
  const [maybeExistingEntry] = await db
    .select()
    .from(sharedCharacterConversation)
    .where(
      and(
        eq(sharedCharacterConversation.userId, user.id),
        eq(sharedCharacterConversation.characterId, characterId),
      ),
    );

  const telliPointsLimit = telliPointsPercentageLimit;
  const maxUsageTimeLimit = usageTimeLimitMinutes;
  const inviteCode = generateInviteCode();
  const startedAt = new Date();
  const [updatedSharedChat] = await db
    .insert(sharedCharacterConversation)
    .values({
      id: maybeExistingEntry?.id,
      userId: user.id,
      characterId,
      telliPointsLimit,
      maxUsageTimeLimit,
      inviteCode,
      startedAt,
    })
    .onConflictDoUpdate({
      target: sharedCharacterConversation.id,
      set: { inviteCode, startedAt, maxUsageTimeLimit },
    })
    .returning();

  if (updatedSharedChat === undefined) {
    throw new Error('Could not share character chat');
  }

  return updatedSharedChat;
};

/**
 * A teacher can unshare a character if he was the one that started the sharing.
 */
export const unshareCharacter = async ({
  characterId,
  user,
}: {
  characterId: string;
  user: Pick<UserModel, 'id' | 'userRole'>;
}) => {
  checkParameterUUID(characterId);
  // Authorization check: user must be a teacher and owner of the sharing itself
  if (user.userRole !== 'teacher')
    throw new ForbiddenError('Only a teacher can unshare a character');

  const sharedConversations = await dbGetSharedCharacterConversations({
    characterId,
    userId: user.id,
  });
  if (sharedConversations.length === 0)
    throw new ForbiddenError('Not authorized to stop this shared character instance');

  // unshare character instance
  const [updatedCharacter] = await db
    .delete(sharedCharacterConversation)
    .where(
      and(
        eq(sharedCharacterConversation.characterId, characterId),
        eq(sharedCharacterConversation.userId, user.id),
      ),
    )
    .returning();

  if (updatedCharacter === undefined) {
    throw new Error('Could not stop sharing of character');
  }

  return updatedCharacter;
};

/**
 * This function is called when a user wants to start a chat session with a character.
 * If the character is private, only the owner can start a chat session.
 * If the character is shared with the school, any user from the same school can start a chat session.
 * If the character is global, any user can start a chat session.
 * @throws NotFoundError if character does not exist
 * @throws ForbiddenError if user is not authorized to access the character
 */
export const getCharacterForChatSession = async ({
  characterId,
  userId,
  schoolId,
}: {
  characterId: string;
  userId: string;
  schoolId: string;
}) => {
  checkParameterUUID(characterId);
  const character = await dbGetCharacterByIdWithShareData({ characterId, userId });
  if (!character) throw new NotFoundError('Character not found');
  if (character.accessLevel === 'private' && character.userId !== userId)
    throw new ForbiddenError('Not authorized to access this character');
  if (character.accessLevel === 'school' && character.schoolId !== schoolId)
    throw new ForbiddenError('Not authorized to access this character');

  return character;
};

export const getCharacterForEditView = async ({
  characterId,
  schoolId,
  userId,
}: {
  characterId: string;
  schoolId: string;
  userId: string;
}): Promise<{
  character: CharacterWithShareDataModel;
  relatedFiles: FileModel[];
  maybeSignedPictureUrl: string | undefined;
}> => {
  checkParameterUUID(characterId);
  const character = await dbGetCharacterByIdWithShareData({ characterId, userId });
  if (!character) throw new NotFoundError('Character not found');
  if (character.accessLevel === 'private' && character.userId !== userId)
    throw new ForbiddenError('Not authorized to edit this character');
  if (character.accessLevel === 'school' && character.schoolId !== schoolId)
    throw new ForbiddenError('Not authorized to edit this character');

  const relatedFiles = await fetchFileMappings({ characterId, userId, schoolId });
  const maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({
    key: character.pictureId,
  });
  return { character, relatedFiles, maybeSignedPictureUrl };
};

/**
 * Returns a character with invite code and other sharing related data for sharing page.
 * @throws NotFoundError if character does not exist or is not shared
 */
export const getSharedCharacter = async ({
  characterId,
  userId,
}: {
  characterId: string;
  userId: string;
}): Promise<CharacterWithShareDataModel> => {
  checkParameterUUID(characterId);
  const character = await dbGetCharacterByIdWithShareData({ characterId, userId });
  if (!character || !character.inviteCode) throw new NotFoundError('Character not found');

  return character;
};

/**
 * Returns all characters a user is allowed to see. That means:
 * - user is owner of character
 * - character is shared with users school
 * - character is global
 * - character is not deleted
 */
export async function getCharacters({
  schoolId,
  userId,
}: {
  schoolId: string;
  userId: string;
}): Promise<CharacterSelectModel[]> {
  const characters = await dbGetCharacters({ userId, schoolId });
  return characters;
}

/**
 * Returns the list of available characters that the user can access
 * based on userId, schoolId, federalStateId and access level.
 */
export async function getCharacterByAccessLevel({
  accessLevel,
  schoolId,
  userId,
  federalStateId,
}: {
  accessLevel: AccessLevel;
  schoolId: string;
  userId: string;
  federalStateId: string;
}): Promise<CharacterWithShareDataModel[]> {
  if (accessLevel === 'global') {
    return dbGetGlobalCharacters({ userId, federalStateId });
  } else if (accessLevel === 'school') {
    return dbGetCharactersBySchoolId({ schoolId, userId });
  } else if (accessLevel === 'private') {
    return dbGetCharactersByUserId({ userId });
  }
  return [];
}

/**
 * Loads character from db
 * @returns
 * - isOwner: whether the user is the owner
 * - isPrivate: whether the character is private
 * - the character itself
 * @throws NotFoundError if character does not exist
 */
export const getCharacterInfo = async (
  characterId: string,
  userId: string,
): Promise<{ isOwner: boolean; isPrivate: boolean; character: CharacterSelectModel }> => {
  const character = await dbGetCharacterById({ characterId });
  if (!character) throw new NotFoundError('Character not found');

  return {
    isOwner: character?.userId === userId,
    isPrivate: character?.accessLevel === 'private',
    character,
  };
};

/**
 * Cleans up characters with empty names from the database.
 * Attention: This is an admin function that does not check any authorization!
 *
 * Note: linked files will be unlinked but removed separately by `dbDeleteDanglingFiles`
 *
 * @returns number of deleted characters in db
 */
export async function cleanupCharacters() {
  const result = await db
    .delete(characterTable)
    .where(and(eq(characterTable.name, ''), lt(characterTable.createdAt, addDays(new Date(), -1))))
    .returning();
  return result.length;
}
