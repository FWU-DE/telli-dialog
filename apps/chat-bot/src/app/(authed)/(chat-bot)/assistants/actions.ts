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
  const { user } = await requireAuth();

  return runServerAction(
    'createNewAssistantAction',
    createNewAssistant,
  )({
    templateId,
    user,
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

  return runServerAction(
    'deleteFileMappingAndEntityAction',
    deleteFileMappingAndEntity,
  )({
    assistantId,
    fileId,
    user,
  });
}

export async function linkFileToAssistantAction({
  fileId,
  assistantId,
}: {
  fileId: string;
  assistantId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'linkFileToAssistantAction',
    linkFileToAssistant,
  )({
    fileId,
    assistantId,
    user,
  });
}

export async function updateAssistantAccessLevelAction({
  assistantId,
  accessLevel,
}: {
  assistantId: string;
  accessLevel: AccessLevel;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'updateAssistantAccessLevelAction',
    updateAssistantAccessLevel,
  )({
    assistantId,
    accessLevel,
    user,
  });
}

export async function updateAssistantAction({
  assistantId,
  ...assistant
}: Partial<AssistantInsertModel> & { assistantId: string }) {
  const { user } = await requireAuth();

  return runServerAction(
    'updateAssistantAction',
    updateAssistant,
  )({
    assistantId,
    user,
    assistantProps: assistant,
  });
}

export async function deleteAssistantAction({ assistantId }: { assistantId: string }) {
  const { user } = await requireAuth();

  return runServerAction('deleteAssistantAction', deleteAssistant)({ assistantId, user });
}

export async function uploadAvatarPictureForAssistantAction({
  assistantId,
  croppedImageBlob,
}: {
  assistantId: string;
  croppedImageBlob: Blob;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'uploadAvatarPictureForAssistantAction',
    uploadAvatarPictureForAssistant,
  )({
    assistantId,
    croppedImageBlob,
    user,
  });
}

export async function downloadFileFromAssistantAction({
  assistantId,
  fileId,
}: {
  assistantId: string;
  fileId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'downloadFileFromAssistantAction',
    downloadFileFromAssistant,
  )({
    assistantId,
    fileId,
    user,
  });
}
