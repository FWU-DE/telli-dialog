'use server';

import { AccessLevel } from '@shared/db/schema';
import { SharedConversationShareFormValues } from '../../../shared-chats/[sharedSchoolChatId]/schema';
import { requireAuth } from '@/auth/requireAuth';
import {
  deleteCharacter,
  deleteFileMappingAndEntity,
  linkFileToCharacter,
  shareCharacter,
  unshareCharacter,
  updateCharacter,
  updateCharacterAccessLevel,
  UpdateCharacterActionModel,
  updateCharacterPicture,
} from '@shared/characters/character-service';
import { runServerAction } from '@shared/actions/run-server-action';

export async function updateCharacterAccessLevelAction({
  characterId,
  accessLevel,
}: {
  characterId: string;
  accessLevel: AccessLevel;
}) {
  const { user } = await requireAuth();

  return runServerAction(updateCharacterAccessLevel)({
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

  return runServerAction(updateCharacterPicture)({
    characterId,
    picturePath,
    userId: user.id,
  });
}

export async function updateCharacterAction(character: UpdateCharacterActionModel) {
  const { user } = await requireAuth();

  return runServerAction(updateCharacter)({
    userId: user.id,
    ...character,
  });
}

export async function deleteCharacterAction({ characterId }: { characterId: string }) {
  const { user } = await requireAuth();

  return runServerAction(deleteCharacter)({
    characterId,
    userId: user.id,
  });
}

export async function shareCharacterAction({
  id,
  telliPointsPercentageLimit,
  usageTimeLimit,
}: { id: string } & SharedConversationShareFormValues) {
  const { user, school } = await requireAuth();

  return runServerAction(shareCharacter)({
    characterId: id,
    telliPointsPercentageLimit: telliPointsPercentageLimit,
    usageTimeLimitMinutes: usageTimeLimit,
    user: user,
    schoolId: school?.id,
  });
}

export async function unshareCharacterAction({ characterId }: { characterId: string }) {
  const { user } = await requireAuth();

  return runServerAction(unshareCharacter)({
    characterId,
    user: user,
  });
}

export async function deleteFileMappingAndEntityAction({
  characterId,
  fileId,
}: {
  characterId: string;
  fileId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(deleteFileMappingAndEntity)({
    characterId,
    fileId,
    userId: user.id,
  });
}

export async function linkFileToCharacterAction({
  fileId,
  characterId,
}: {
  fileId: string;
  characterId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(linkFileToCharacter)({ fileId, characterId, userId: user.id });
}
