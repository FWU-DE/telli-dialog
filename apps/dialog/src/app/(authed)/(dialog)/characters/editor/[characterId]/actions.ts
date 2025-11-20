'use server';

import { CharacterAccessLevel } from '@shared/db/schema';
import { SharedConversationShareFormValues } from '../../../shared-chats/[sharedSchoolChatId]/schema';
import { requireAuth } from '@/auth/requireAuth';
import { withLoggingAsync } from '@shared/logging';
import {
  deleteCharacter,
  shareCharacter,
  unshareCharacater,
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

export async function shareCharacterAction({
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

export async function unshareCharacaterAction({ id }: { id: string }) {
  const { user } = await requireAuth();

  return withLoggingAsync(unshareCharacater)({
    id,
    user: user,
  });
}
