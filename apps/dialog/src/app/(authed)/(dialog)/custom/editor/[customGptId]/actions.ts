'use server';

import { AccessLevel, AssistantInsertModel } from '@shared/db/schema';
import {
  deleteAssistant,
  updateAssistant,
  updateAssistantAccessLevel,
  uploadAvatarPictureForAssistant,
} from '@shared/assistants/assistant-service';
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
