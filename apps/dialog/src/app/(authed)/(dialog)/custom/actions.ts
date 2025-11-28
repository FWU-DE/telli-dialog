'use server';

import { FileModel } from '@shared/db/schema';
import { requireAuth } from '@/auth/requireAuth';
import {
  createNewCustomGpt,
  deleteFileMappingAndEntity,
  fetchFileMapping,
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
    userId: user.id,
  });
}

export async function deleteFileMappingAndEntityAction({ fileId }: { fileId: string }) {
  await requireAuth();
  return deleteFileMappingAndEntity({ fileId });
}

export async function fetchFileMappingAction(id: string): Promise<FileModel[]> {
  const { user } = await requireAuth();
  return fetchFileMapping(id, user.id);
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
