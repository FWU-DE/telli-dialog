'use server';

import { requireAuth } from '@/auth/requireAuth';
import {
  createNewCustomGpt,
  deleteFileMappingAndEntity,
  linkFileToCustomGpt,
} from '@shared/custom-gpt/custom-gpt-service';
import { runServerAction } from '@shared/actions/run-server-action';

export async function createNewCustomGptAction({
  templatePictureId,
  templateId,
}: {
  templatePictureId?: string;
  templateId?: string;
}) {
  const { user, school } = await requireAuth();

  return runServerAction(createNewCustomGpt)({
    schoolId: school.id,
    templatePictureId,
    templateId,
    user: user,
  });
}

export async function deleteFileMappingAndEntityAction({
  fileId,
  customGptId,
}: {
  fileId: string;
  customGptId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(deleteFileMappingAndEntity)({ customGptId, fileId, userId: user.id });
}

export async function linkFileToCustomGptAction({
  fileId,
  customGptId,
}: {
  fileId: string;
  customGptId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(linkFileToCustomGpt)({ fileId, customGptId, userId: user.id });
}
