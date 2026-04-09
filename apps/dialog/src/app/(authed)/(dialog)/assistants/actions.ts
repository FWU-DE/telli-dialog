'use server';

import { requireAuth } from '@/auth/requireAuth';
import {
  createNewAssistant,
  deleteFileMappingAndEntity,
  downloadFileFromAssistant,
  linkFileToAssistant,
  deleteAssistant,
  updateAssistant,
  updateAssistantAccessLevel,
  uploadAvatarPictureForAssistant,
} from '@shared/assistants/assistant-service';
import { runServerAction } from '@shared/actions/run-server-action';
import { AccessLevel, AssistantInsertModel } from '@shared/db/schema';

export async function createNewAssistantAction({
  templateId,
  duplicateAssistantName,
}: {
  templateId?: string;
  duplicateAssistantName?: string;
}) {
  const { user, school } = await requireAuth();

  return runServerAction(createNewAssistant)({
    schoolId: school.id,
    templateId,
    user: user,
    duplicateAssistantName,
  });
}

export async function deleteFileMappingAndEntityAction({
  fileId,
  assistantId,
}: {
  fileId: string;
  assistantId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(deleteFileMappingAndEntity)({ assistantId, fileId, userId: user.id });
}

export async function linkFileToAssistantAction({
  fileId,
  assistantId,
}: {
  fileId: string;
  assistantId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(linkFileToAssistant)({ fileId, assistantId, userId: user.id });
}

export async function updateAssistantAccessLevelAction({
  assistantId,
  accessLevel,
}: {
  assistantId: string;
  accessLevel: AccessLevel;
}) {
  const { user } = await requireAuth();

  return runServerAction(updateAssistantAccessLevel)({
    assistantId,
    accessLevel,
    userId: user.id,
  });
}

export async function updateAssistantAction({
  assistantId,
  ...assistant
}: Partial<AssistantInsertModel> & { assistantId: string }) {
  const { user } = await requireAuth();

  return runServerAction(updateAssistant)({
    assistantId,
    userId: user.id,
    assistantProps: assistant,
  });
}

export async function deleteAssistantAction({ assistantId }: { assistantId: string }) {
  const { user } = await requireAuth();

  return runServerAction(deleteAssistant)({ assistantId, userId: user.id });
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

export async function downloadFileFromAssistantAction({
  assistantId,
  fileId,
}: {
  assistantId: string;
  fileId: string;
}) {
  const { user, school } = await requireAuth();

  return runServerAction(downloadFileFromAssistant)({
    assistantId,
    fileId,
    schoolId: school.id,
    user,
  });
}
