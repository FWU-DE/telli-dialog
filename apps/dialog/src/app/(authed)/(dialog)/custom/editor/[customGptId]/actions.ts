'use server';

import { AccessLevel, AssistantInsertModel } from '@shared/db/schema';
import {
  deleteAssistant,
  updateAssistant,
  updateAssistantAccessLevel,
  updateAssistantPicture,
  uploadAvatarPictureForAssistant,
} from '@shared/custom-gpt/custom-gpt-service';
import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';

export async function updateAssistantAccessLevelAction({
  gptId: gptId,
  accessLevel,
}: {
  gptId: string;
  accessLevel: AccessLevel;
}) {
  const { user } = await requireAuth();

  return runServerAction(updateAssistantAccessLevel)({
    assistantId: gptId,
    accessLevel,
    userId: user.id,
  });
}

export async function updateAssistantPictureAction({
  gptId,
  picturePath,
}: {
  gptId: string;
  picturePath: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(updateAssistantPicture)({
    assistantId: gptId,
    picturePath,
    userId: user.id,
  });
}

export async function updateAssistantAction({
  gptId,
  ...assistant
}: Partial<AssistantInsertModel> & { gptId: string }) {
  const { user } = await requireAuth();

  return runServerAction(updateAssistant)({
    assistantId: gptId,
    userId: user.id,
    assistantProps: assistant,
  });
}

export async function deleteAssistantAction({ gptId }: { gptId: string }) {
  const { user } = await requireAuth();

  return runServerAction(deleteAssistant)({ assistantId: gptId, userId: user.id });
}

export async function uploadAvatarPictureForAssistantAction({
  assistantId,
  croppedImageBlob,
}: {
  assistantId: string;
  croppedImageBlob: Blob;
}) {
  const { user } = await requireAuth();

  return runServerAction(uploadAvatarPictureForAssistant)({
    assistantId,
    croppedImageBlob,
    userId: user.id,
  });
}
