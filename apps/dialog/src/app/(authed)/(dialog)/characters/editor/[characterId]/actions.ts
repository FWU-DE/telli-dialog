'use server';

import { db } from '@shared/db';
import { CharacterAccessLevel, sharedCharacterConversation } from '@shared/db/schema';
import { getUser } from '@/auth/utils';
import { and, eq } from 'drizzle-orm';
import { SharedConversationShareFormValues } from '../../../shared-chats/[sharedSchoolChatId]/schema';
import { requireAuth } from '@/auth/requireAuth';
import { withLoggingAsync } from '@shared/logging';
import {
  deleteCharacter,
  shareCharacter,
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
  intelliPointsPercentageLimit,
  usageTimeLimit,
}: { id: string } & SharedConversationShareFormValues) {
  const { user } = await requireAuth();

  return withLoggingAsync(shareCharacter)({
    id,
    telliPointsPercentageLimit: intelliPointsPercentageLimit,
    usageTimeLimitMinutes: usageTimeLimit,
    user: user,
  });
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
