'use server';

import { db } from '@shared/db';
import { dbDeleteCharacterByIdAndUserId } from '@shared/db/functions/character';
import { CharacterAccessLevel, sharedCharacterConversation } from '@shared/db/schema';
import { deleteFileFromS3 } from '@shared/s3';
import { getUser } from '@/auth/utils';
import { and, eq } from 'drizzle-orm';
import { SharedConversationShareFormValues } from '../../../shared-chats/[sharedSchoolChatId]/schema';
import { generateInviteCode } from '../../../shared-chats/[sharedSchoolChatId]/utils';
import { requireAuth } from '@/auth/requireAuth';
import { withLoggingAsync } from '@shared/logging';
import {
  deleteCharacter,
  updateCharacter,
  updateCharacterAccessLevel,
  UpdateCharacterActionModel,
  updateCharacterPicture,
} from '@shared/characters/character-service';

export async function updateCharacterAccessLevelAction({
  characterId,
  accessLevel,
}: {
  characterId: string;
  accessLevel: CharacterAccessLevel;
}) {
  const { user } = await requireAuth();

  return await withLoggingAsync(updateCharacterAccessLevel)({
    characterId,
    accessLevel,
    userId: user.id,
  });
}

export async function updateCharacterPictureAction({
  characterId,
  picturePath,
}: {
  characterId: string;
  picturePath: string;
}) {
  const { user } = await requireAuth();

  return await withLoggingAsync(updateCharacterPicture)({
    characterId,
    picturePath,
    userId: user.id,
  });
}

export async function updateCharacterAction({
  characterId,
  ...character
}: UpdateCharacterActionModel & { characterId: string }) {
  const { user } = await requireAuth();

  return await withLoggingAsync(updateCharacter)({
    characterId,
    userId: user.id,
    ...character,
  });
}

export async function deleteCharacterAction({
  characterId,
  pictureId,
}: {
  characterId: string;
  pictureId?: string;
}) {
  const { user } = await requireAuth();

  await withLoggingAsync(deleteCharacter)({
    characterId,
    pictureId,
    userId: user.id,
  });
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
