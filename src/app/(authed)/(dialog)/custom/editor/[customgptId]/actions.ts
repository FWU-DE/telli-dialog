'use server';

import { db } from '@/db';
import { CharacterAccessLevel, CustomGptInsertModel, customGptTable } from '@/db/schema';
import { deleteFileFromS3 } from '@/s3';
import { getUser } from '@/auth/utils';
import { and, eq } from 'drizzle-orm';
import { dbDeleteCustomGptByIdAndUserId } from '@/db/functions/custom-gpts';
import { removeNullValues } from '@/utils/generic/object-operations';

export async function updateCustomGptAccessLevelAction({
  gptId: gptId,
  accessLevel,
}: {
  gptId: string;
  accessLevel: CharacterAccessLevel;
}) {
  if (accessLevel === 'global') {
    throw Error('Cannot update customGpt to be global');
  }

  const user = await getUser();

  const updatedCustomGpt = (
    await db
      .update(customGptTable)
      .set({ accessLevel })
      .where(and(eq(customGptTable.id, gptId), eq(customGptTable.userId, user.id)))
      .returning()
  )[0];

  if (updatedCustomGpt === undefined) {
    throw Error('Could not update the access level of the customGpt');
  }

  return updatedCustomGpt;
}

export async function updateCustomGptPictureAction({
  gptId,
  picturePath,
}: {
  gptId: string;
  picturePath: string;
}) {
  const user = await getUser();
  const updatedCustomGpt = (
    await db
      .update(customGptTable)
      .set({ pictureId: picturePath })
      .where(and(eq(customGptTable.id, gptId), eq(customGptTable.userId, user.id)))
      .returning()
  )[0];

  if (updatedCustomGpt === undefined) {
    throw Error('Could not update the picture of the customGpt');
  }

  return updatedCustomGpt;
}

export async function updateCustomGptAction({
  gptId,
  ...customGpt
}: Partial<CustomGptInsertModel> & { gptId: string }) {
  const user = await getUser();

  const cleanedCustomGpt =  removeNullValues(customGpt)
  if (cleanedCustomGpt === undefined) return 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, ...updatableProps } = cleanedCustomGpt;

  const updatedGpt = (
    await db
      .update(customGptTable)
      .set({ ...updatableProps })
      .where(and(eq(customGptTable.id, gptId), eq(customGptTable.userId, user.id)))
      .returning()
  )[0];

  if (updatedGpt === undefined) {
    throw Error('Could not update the customGpt');
  }

  return updatedGpt;
}

export async function deleteCustomGptAction({ gptId }: { gptId: string }) {
  const user = await getUser();

  const deletedCustomGpt = await dbDeleteCustomGptByIdAndUserId({ gptId: gptId, userId: user.id });

  const maybePictureId = deletedCustomGpt.pictureId;

  if (maybePictureId !== null) {
    try {
      await deleteFileFromS3({ key: maybePictureId });
    } catch (error) {
      console.error({ error });
    }
  }

  return deletedCustomGpt;
}
