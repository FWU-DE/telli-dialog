'use server';

import { FileModel } from '@shared/db/schema';
import { requireAuth } from '@/auth/requireAuth';
import {
  createNewCustomGpt,
  deleteFileMappingAndEntity,
  getFileMappings,
} from '@shared/custom-gpt/custom-gpt-service';

export async function createNewCustomGptAction({
  templatePictureId,
  templateId,
}: {
  templatePictureId?: string;
  templateId?: string;
} = {}) {
  const { user, school } = await requireAuth();

  return createNewCustomGpt({
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
  return deleteFileMappingAndEntity({ customGptId, fileId, userId: user.id });
}

export async function fetchFileMappingAction(id: string): Promise<FileModel[]> {
  const { user, school } = await requireAuth();
  return getFileMappings({ customGptId: id, schoolId: school.id, userId: user.id });
}

export async function linkFileToCustomGptAction({
  fileId,
  customGpt,
}: {
  fileId: string;
  customGpt: string;
}) {
  await requireAuth();
  return linkFileToCustomGptAction({ fileId, customGpt });
}
