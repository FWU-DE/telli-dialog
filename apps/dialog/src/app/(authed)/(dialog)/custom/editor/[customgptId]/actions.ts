'use server';

import { CharacterAccessLevel, CustomGptInsertModel } from '@shared/db/schema';
import {
  deleteCustomGpt,
  updateCustomGpt,
  updateCustomGptAccessLevel,
  updateCustomGptPicture,
} from '@shared/custom-gpt/custom-gpt-service';
import { requireAuth } from '@/auth/requireAuth';

export async function updateCustomGptAccessLevelAction({
  gptId: gptId,
  accessLevel,
}: {
  gptId: string;
  accessLevel: CharacterAccessLevel;
}) {
  const { user } = await requireAuth();

  return updateCustomGptAccessLevel({
    gptId,
    accessLevel,
    userId: user.id,
  });
}

export async function updateCustomGptPictureAction({
  gptId,
  picturePath,
}: {
  gptId: string;
  picturePath: string;
}) {
  const { user } = await requireAuth();

  return updateCustomGptPicture({
    gptId,
    picturePath,
    userId: user.id,
  });
}

export async function updateCustomGptAction({
  gptId,
  ...customGpt
}: Partial<CustomGptInsertModel> & { gptId: string }) {
  const { user } = await requireAuth();

  return updateCustomGpt({
    gptId,
    userId: user.id,
    customGptProps: customGpt,
  });
}

export async function deleteCustomGptAction({ gptId }: { gptId: string }) {
  const { user } = await requireAuth();

  return deleteCustomGpt({ gptId, userId: user.id });
}
