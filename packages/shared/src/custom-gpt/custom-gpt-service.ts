import { db } from '@shared/db';
import { dbDeleteCustomGptByIdAndUserId } from '@shared/db/functions/custom-gpts';
import { dbGetRelatedCustomGptFiles } from '@shared/db/functions/files';
import {
  CharacterAccessLevel,
  CustomGptFileMapping,
  CustomGptInsertModel,
  customGptTable,
  FileModel,
  fileTable,
} from '@shared/db/schema';
import { copyFileInS3 } from '@shared/s3';
import { copyCustomGpt, copyRelatedTemplateFiles } from '@shared/templates/templateService';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { generateUUID } from '@shared/utils/uuid';
import { and, eq } from 'drizzle-orm';

/**
 * User creates a new custom gpt (assistant).
 * If a templateId is provided, the new custom gpt is created by copying the template.
 */
export async function createNewCustomGpt({
  schoolId,
  templatePictureId,
  templateId,
  userId,
}: {
  schoolId: string;
  templatePictureId?: string;
  templateId?: string;
  userId: string;
}) {
  if (templateId !== undefined) {
    let insertedCustomGpt = await copyCustomGpt(templateId, 'private', userId, schoolId);

    if (templatePictureId !== undefined) {
      const copyOfTemplatePicture = `custom-gpts/${insertedCustomGpt.id}/avatar`;
      await copyFileInS3({
        newKey: copyOfTemplatePicture,
        copySource: templatePictureId,
      });

      // Update the custom GPT with the new picture
      const [updatedCustomGpt] = await db
        .update(customGptTable)
        .set({ pictureId: copyOfTemplatePicture })
        .where(eq(customGptTable.id, insertedCustomGpt.id))
        .returning();

      if (updatedCustomGpt) {
        insertedCustomGpt = updatedCustomGpt;
      }
    }

    await copyRelatedTemplateFiles('custom-gpt', templateId, insertedCustomGpt.id);
    return insertedCustomGpt;
  }

  const customGptId = generateUUID();

  const [insertedCustomGpt] = await db
    .insert(customGptTable)
    .values({
      id: customGptId,
      name: '',
      systemPrompt: '',
      userId: userId,
      schoolId: schoolId,
      description: '',
      specification: '',
      promptSuggestions: [],
    })
    .returning();

  if (insertedCustomGpt === undefined) {
    throw Error('Could not create a new CustomGpt');
  }

  return insertedCustomGpt;
}

/**
 * delete file mapping and the file entity itself
 */
export async function deleteFileMappingAndEntity({ fileId }: { fileId: string }) {
  await db.delete(CustomGptFileMapping).where(eq(CustomGptFileMapping.fileId, fileId));
  await db.delete(fileTable).where(eq(fileTable.id, fileId));
}

/**
 * get file mappings for a custom gpt
 */
export async function fetchFileMapping(customGptId: string, userId: string): Promise<FileModel[]> {
  if (userId === undefined) return [];
  return await dbGetRelatedCustomGptFiles(customGptId);
}

/**
 * link a file to a custom gpt
 */
export async function linkFileToCustomGpt({
  fileId,
  customGpt,
}: {
  fileId: string;
  customGpt: string;
}) {
  const [insertedFileMapping] = await db
    .insert(CustomGptFileMapping)
    .values({ customGptId: customGpt, fileId: fileId })
    .returning();
  if (insertedFileMapping === undefined) {
    throw new Error('Could not Link file to character');
  }
}

/**
 * update access level, e.g. from private to school or back to private
 */
export async function updateCustomGptAccessLevel({
  gptId: gptId,
  accessLevel,
  userId,
}: {
  accessLevel: CharacterAccessLevel;
  gptId: string;
  userId: string;
}) {
  if (accessLevel === 'global') {
    throw Error('Cannot update customGpt to be global');
  }

  const updatedCustomGpt = (
    await db
      .update(customGptTable)
      .set({ accessLevel })
      .where(and(eq(customGptTable.id, gptId), eq(customGptTable.userId, userId)))
      .returning()
  )[0];

  if (updatedCustomGpt === undefined) {
    throw Error('Could not update the access level of the customGpt');
  }

  return updatedCustomGpt;
}

/**
 * set a new picture for the custom gpt
 */
export async function updateCustomGptPicture({
  gptId,
  picturePath,
  userId,
}: {
  gptId: string;
  picturePath: string;
  userId: string;
}) {
  const [updatedCustomGpt] = await db
    .update(customGptTable)
    .set({ pictureId: picturePath })
    .where(and(eq(customGptTable.id, gptId), eq(customGptTable.userId, userId)))
    .returning();

  if (updatedCustomGpt === undefined) {
    throw Error('Could not update the picture of the customGpt');
  }

  return updatedCustomGpt;
}

/**
 * update custom gpt properties
 */
export async function updateCustomGpt({
  gptId,
  userId,
  customGptProps,
}: {
  gptId: string;
  userId: string;
  customGptProps: Partial<CustomGptInsertModel>;
}) {
  const cleanedCustomGpt = removeNullishValues(customGptProps);
  if (cleanedCustomGpt === undefined) return;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, ...updatableProps } = cleanedCustomGpt;

  const [updatedGpt] = await db
    .update(customGptTable)
    .set({ ...updatableProps })
    .where(and(eq(customGptTable.id, gptId), eq(customGptTable.userId, userId)))
    .returning();

  if (updatedGpt === undefined) {
    throw Error('Could not update the customGpt');
  }

  return updatedGpt;
}

export async function deleteCustomGpt({ gptId, userId }: { gptId: string; userId: string }) {
  return dbDeleteCustomGptByIdAndUserId({ gptId: gptId, userId: userId });
}
