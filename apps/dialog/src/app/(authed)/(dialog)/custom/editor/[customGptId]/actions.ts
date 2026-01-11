'use server';

import { AccessLevel, CustomGptInsertModel } from '@shared/db/schema';
import {
  deleteCustomGpt,
  updateCustomGpt,
  updateCustomGptAccessLevel,
  updateCustomGptPicture,
} from '@shared/custom-gpt/custom-gpt-service';
import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';

export async function updateCustomGptAccessLevelAction({
  gptId: gptId,
  accessLevel,
}: {
  gptId: string;
  accessLevel: AccessLevel;
}) {
  const { user } = await requireAuth();

  return runServerAction(updateCustomGptAccessLevel)({
    customGptId: gptId,
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

  return runServerAction(updateCustomGptPicture)({
    customGptId: gptId,
    picturePath,
    userId: user.id,
  });
}

export async function updateCustomGptAction({
  gptId,
  ...customGpt
}: Partial<CustomGptInsertModel> & { gptId: string }) {
  const { user } = await requireAuth();

  return runServerAction(updateCustomGpt)({
    customGptId: gptId,
    userId: user.id,
    customGptProps: customGpt,
  });
}

export async function deleteCustomGptAction({ gptId }: { gptId: string }) {
  const { user } = await requireAuth();

  return runServerAction(deleteCustomGpt)({ customGptId: gptId, userId: user.id });
}
