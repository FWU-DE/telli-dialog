'use server';

import { db } from '@/db';
import { dbDeleteCharacterByIdAndUserId } from '@/db/functions/character';
import { CharacterAccessLevel, CharacterInsertModel, characterTable } from '@/db/schema';
import { deleteFileFromS3 } from '@/s3';
import { getUser } from '@/auth/utils';
import { and, eq } from 'drizzle-orm';

export async function updateCharacterAccessLevelAction({
  characterId,
  accessLevel,
}: {
  characterId: string;
  accessLevel: CharacterAccessLevel;
}) {
  if (accessLevel === 'global') {
    throw Error('Cannot update character to be global');
  }

  const user = await getUser();

  const updatedCharacter = (
    await db
      .update(characterTable)
      .set({ accessLevel })
      .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, user.id)))
      .returning()
  )[0];

  if (updatedCharacter === undefined) {
    throw Error('Could not update the access level of the character');
  }

  return updatedCharacter;
}

export async function updateCharacterPictureAction({
  characterId,
  picturePath,
}: {
  characterId: string;
  picturePath: string;
}) {
  const user = await getUser();

  const updatedCharacter = (
    await db
      .update(characterTable)
      .set({ pictureId: picturePath })
      .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, user.id)))
      .returning()
  )[0];

  if (updatedCharacter === undefined) {
    throw Error('Could not update the picture of the character');
  }

  return updatedCharacter;
}

export async function updateCharacterAction({
  characterId,
  ...character
}: Omit<CharacterInsertModel, 'userId'> & { characterId: string }) {
  const user = await getUser();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, pictureId, accessLevel, schoolId, createdAt, ...updatableProps } = character;

  const updatedCharacter = (
    await db
      .update(characterTable)
      .set({ ...updatableProps })
      .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, user.id)))
      .returning()
  )[0];

  if (updatedCharacter === undefined) {
    throw Error('Could not update the character');
  }

  return updatedCharacter;
}

export async function deleteCharacterAction({ characterId }: { characterId: string }) {
  const user = await getUser();

  const deletedCharacter = await dbDeleteCharacterByIdAndUserId({ characterId, userId: user.id });

  const maybePictureId = deletedCharacter.pictureId;

  if (maybePictureId !== null) {
    try {
      await deleteFileFromS3({ key: maybePictureId });
    } catch (error) {
      console.error({ error });
    }
  }

  return deletedCharacter;
}
