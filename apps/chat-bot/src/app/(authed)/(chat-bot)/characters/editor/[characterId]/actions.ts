'use server';

import { AccessLevel } from '@shared/db/schema';
import { SharedConversationShareFormValues } from '../../../learning-scenarios/editor/[learningScenarioId]/schema';
import { requireAuth } from '@/auth/requireAuth';
import {
  deleteCharacter,
  deleteFileMappingAndEntity,
  downloadFileFromCharacter,
  linkFileToCharacter,
  shareCharacter,
  unshareCharacter,
  updateCharacter,
  updateCharacterAccessLevel,
  UpdateCharacterActionModel,
  uploadAvatarPictureForCharacter,
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

  return runServerAction(
    'updateCharacterAccessLevelAction',
    updateCharacterAccessLevel,
  )({
    characterId,
    accessLevel,
    user,
  });
}

export async function updateCharacterAction(character: UpdateCharacterActionModel) {
  const { user } = await requireAuth();

  return runServerAction(
    'updateCharacterAction',
    updateCharacter,
  )({
    user,
    ...character,
  });
}

export async function deleteCharacterAction({ characterId }: { characterId: string }) {
  const { user } = await requireAuth();

  return runServerAction(
    'deleteCharacterAction',
    deleteCharacter,
  )({
    characterId,
    user,
  });
}

export async function shareCharacterAction({
  id,
  tokenPointsPercentageLimit,
  usageTimeLimit,
}: { id: string } & SharedConversationShareFormValues) {
  const { user } = await requireAuth();

  return runServerAction(
    'shareCharacterAction',
    shareCharacter,
  )({
    characterId: id,
    tokenPointsPercentageLimit,
    usageTimeLimitMinutes: usageTimeLimit,
    user,
  });
}

export async function unshareCharacterAction({ characterId }: { characterId: string }) {
  const { user } = await requireAuth();

  return runServerAction(
    'unshareCharacterAction',
    unshareCharacter,
  )({
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

  return runServerAction(
    'deleteFileMappingAndEntityAction',
    deleteFileMappingAndEntity,
  )({
    characterId,
    fileId,
    user,
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

  return runServerAction(
    'linkFileToCharacterAction',
    linkFileToCharacter,
  )({
    fileId,
    characterId,
    user,
  });
}

export async function uploadAvatarPictureForCharacterAction({
  characterId,
  croppedImageBlob,
}: {
  characterId: string;
  croppedImageBlob: Blob;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'uploadAvatarPictureForCharacterAction',
    uploadAvatarPictureForCharacter,
  )({
    characterId,
    croppedImageBlob,
    user,
  });
}

export async function downloadFileFromCharacterAction({
  characterId,
  fileId,
}: {
  characterId: string;
  fileId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'downloadFileFromCharacterAction',
    downloadFileFromCharacter,
  )({
    characterId,
    fileId,
    user,
  });
}
