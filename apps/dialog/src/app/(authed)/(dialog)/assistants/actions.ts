'use server';

import { requireAuth } from '@/auth/requireAuth';
import {
  createNewAssistant,
  deleteFileMappingAndEntity,
  linkFileToAssistant,
} from '@shared/assistants/assistant-service';
import { runServerAction } from '@shared/actions/run-server-action';

export async function createNewAssistantAction({
  templatePictureId,
  templateId,
}: {
  templatePictureId?: string;
  templateId?: string;
}) {
  const { user, school } = await requireAuth();

  return runServerAction(createNewAssistant)({
    schoolId: school.id,
    templatePictureId,
    templateId,
    user: user,
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
