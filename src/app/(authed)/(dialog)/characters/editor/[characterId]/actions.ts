'use server';

import { db } from '@/db';
import { dbDeleteCharacterByIdAndUserId } from '@/db/functions/character';
import {
  CharacterAccessLevel,
  CharacterInsertModel,
  characterTable,
  sharedCharacterConversation,
} from '@/db/schema';
import { deleteFileFromS3 } from '@/s3';
import { getUser } from '@/auth/utils';
import { and, eq } from 'drizzle-orm';
import { SharedConversationShareFormValues } from '../../../shared-chats/[sharedSchoolChatId]/schema';
import { generateInviteCode } from '../../../shared-chats/[sharedSchoolChatId]/utils';
import { removeNullValues } from '@/utils/generic/object-operations';

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
  const cleanedCharacter = removeNullValues(character);
  if (cleanedCharacter === undefined) return;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, accessLevel, schoolId, createdAt, ...updatableProps } = cleanedCharacter;
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

export async function deleteCharacterAction({
  characterId,
  pictureId,
}: {
  characterId: string;
  pictureId?: string;
}) {
  const user = await getUser();

  const deletedCharacter = await dbDeleteCharacterByIdAndUserId({ characterId, userId: user.id });

  const maybePictureId = deletedCharacter.pictureId ?? pictureId;

  if (maybePictureId != null) {
    try {
      await deleteFileFromS3({ key: maybePictureId });
    } catch (error) {
      console.error({ error });
    }
  }

  return deletedCharacter;
}

export async function handleInitiateCharacterShareAction({
  id,
  intelliPointsPercentageLimit: _intelliPointsPercentageLimit,
  usageTimeLimit: _usageTimeLimit,
}: { id: string } & SharedConversationShareFormValues) {
  const user = await getUser();

  if (user.school === undefined) {
    throw Error('User is not part of a school');
  }

  if (user.school.userRole !== 'teacher') {
    throw Error('Only a teacher can share a character');
  }

  const [maybeExistingEntry] = await db
    .select()
    .from(sharedCharacterConversation)
    .where(
      and(
        eq(sharedCharacterConversation.userId, user.id),
        eq(sharedCharacterConversation.characterId, id),
      ),
    );
  const intelligencePointsLimit = _intelliPointsPercentageLimit;
  const maxUsageTimeLimit = _usageTimeLimit;
  const inviteCode = generateInviteCode();
  const startedAt = new Date();
  const updatedSharedChat = (
    await db
      .insert(sharedCharacterConversation)
      .values({
        id: maybeExistingEntry?.id,
        userId: user.id,
        characterId: id,
        intelligencePointsLimit,
        maxUsageTimeLimit,
        inviteCode,
        startedAt,
      })
      .onConflictDoUpdate({
        target: sharedCharacterConversation.id,
        set: { inviteCode, startedAt, maxUsageTimeLimit },
      })
      .returning()
  )[0];

  if (updatedSharedChat === undefined) {
    throw Error('Could not shared character chat');
  }

  return updatedSharedChat;
}

export async function handleStopCharacaterShareAction({ id }: { id: string }) {
  const user = await getUser();

  if (user.school === undefined) {
    throw Error('User is not part of a school');
  }

  if (user.school.userRole !== 'teacher') {
    throw Error('Only a teacher can stop share a character');
  }

  const updatedCharacter = (
    await db
      .delete(sharedCharacterConversation)
      .where(
        and(
          eq(sharedCharacterConversation.characterId, id),
          eq(sharedCharacterConversation.userId, user.id),
        ),
      )
      .returning()
  )[0];

  if (updatedCharacter === undefined) {
    throw Error('Could not stop share character');
  }

  return updatedCharacter;
}
