import { UserModel } from '@shared/auth/user-model';
import { db } from '@shared/db';
import {
  dbDeleteCustomGptByIdAndUserId,
  dbGetCustomGptById,
  dbInsertCustomGptFileMapping,
} from '@shared/db/functions/custom-gpts';
import { dbGetRelatedCustomGptFiles } from '@shared/db/functions/files';
import {
  CharacterAccessLevel,
  CustomGptFileMapping,
  customGptTable,
  customGptUpdateSchema,
  FileModel,
  fileTable,
} from '@shared/db/schema';
import { ForbiddenError } from '@shared/error';
import { copyFileInS3 } from '@shared/s3';
import { copyCustomGpt, copyRelatedTemplateFiles } from '@shared/templates/templateService';
import { generateUUID } from '@shared/utils/uuid';
import { and, eq } from 'drizzle-orm';
import z from 'zod';

/**
 * User creates a new custom gpt (assistant).
 * If a templateId is provided, the new custom gpt is created by copying the template.
 * Throws if the user is not a teacher.
 */
export async function createNewCustomGpt({
  schoolId,
  templatePictureId,
  templateId,
  user,
}: {
  schoolId: string;
  templatePictureId?: string;
  templateId?: string;
  user: UserModel;
}) {
  if (user.userRole !== 'teacher') throw new ForbiddenError('Not authorized to create custom gpt');

  if (templateId !== undefined) {
    let insertedCustomGpt = await copyCustomGpt(templateId, 'private', user.id, schoolId);

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
      userId: user.id,
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
 * link a file to a custom gpt
 */
export async function linkFileToCustomGpt({
  fileId,
  customGptId,
  userId,
}: {
  fileId: string;
  customGptId: string;
  userId: string;
}) {
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to access custom gpt');
  }

  const insertedFileMapping = await dbInsertCustomGptFileMapping({
    customGptId,
    fileId: fileId,
  });

  if (insertedFileMapping === undefined) {
    throw new Error('Could not Link file to character');
  }
}

/**
 * delete file mapping and the file entity itself
 */
export async function deleteFileMappingAndEntity({
  customGptId,
  fileId,
  userId,
}: {
  customGptId: string;
  fileId: string;
  userId: string;
}) {
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to access custom gpt');
  }

  await db.delete(CustomGptFileMapping).where(eq(CustomGptFileMapping.fileId, fileId));
  await db.delete(fileTable).where(eq(fileTable.id, fileId));
}

/**
 * Get file mappings for a custom gpt.
 * Throws if the user is not authorized to access the custom gpt:
 * - NotFound if the custom gpt does not exist
 * - Forbidden if the custom gpt is private and the user is not the owner
 * - Forbidden if the custom gpt is school-level and the user is not in the same school
 */
export async function getFileMappings({
  customGptId,
  schoolId,
  userId,
}: {
  customGptId: string;
  schoolId: string;
  userId: string;
}): Promise<FileModel[]> {
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.accessLevel === 'private' && customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to access custom gpt');
  }
  if (
    customGpt.accessLevel === 'school' &&
    customGpt.schoolId !== schoolId &&
    customGpt.userId !== userId
  ) {
    throw new ForbiddenError('Not authorized to access custom gpt');
  }

  return await dbGetRelatedCustomGptFiles(customGptId);
}

/**
 * Update access level, e.g. from private to school or back to private.
 * Global access level is not allowed for this use case.
 * Throws if the user is not the owner of the custom gpt.
 */
export async function updateCustomGptAccessLevel({
  accessLevel,
  customGptId,
  userId,
}: {
  accessLevel: CharacterAccessLevel;
  customGptId: string;
  userId: string;
}) {
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to access custom gpt');
  }
  if (accessLevel === 'global') {
    throw new ForbiddenError('Cannot update customGpt to be global');
  }

  const [updatedCustomGpt] = await db
    .update(customGptTable)
    .set({ accessLevel })
    .where(and(eq(customGptTable.id, customGptId), eq(customGptTable.userId, userId)))
    .returning();

  if (!updatedCustomGpt) {
    throw Error('Could not update the access level of the customGpt');
  }

  return updatedCustomGpt;
}

/**
 * Set a new picture for the custom gpt.
 * Throws if the user is not the owner of the custom gpt.
 */
export async function updateCustomGptPicture({
  customGptId,
  picturePath,
  userId,
}: {
  customGptId: string;
  picturePath: string;
  userId: string;
}) {
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to access custom gpt');
  }

  const [updatedCustomGpt] = await db
    .update(customGptTable)
    .set({ pictureId: picturePath })
    .where(and(eq(customGptTable.id, customGptId), eq(customGptTable.userId, userId)))
    .returning();

  if (updatedCustomGpt === undefined) {
    throw new Error('Could not update the picture of the customGpt');
  }

  return updatedCustomGpt;
}

const updateCustomGptSchema = customGptUpdateSchema
  .omit({
    id: true,
    pictureId: true,
    isDeleted: true,
    originalCustomGptId: true,
    accessLevel: true,
  })
  .partial();

/**
 * Update custom gpt properties.
 * Throws if the user is not the owner of the custom gpt.
 */
export async function updateCustomGpt({
  customGptId,
  userId,
  customGptProps,
}: {
  customGptId: string;
  userId: string;
  customGptProps: z.infer<typeof updateCustomGptSchema>;
}) {
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to access custom gpt');
  }

  const parsedValues = updateCustomGptSchema.parse(customGptProps);

  const [updatedGpt] = await db
    .update(customGptTable)
    .set(parsedValues)
    .where(and(eq(customGptTable.id, customGptId), eq(customGptTable.userId, userId)))
    .returning();

  if (updatedGpt === undefined) {
    throw Error('Could not update the customGpt');
  }

  return updatedGpt;
}

/**
 * Deletes a custom gpt.
 * Throws if the user is not the owner of the custom gpt.
 */
export async function deleteCustomGpt({
  customGptId,
  userId,
}: {
  customGptId: string;
  userId: string;
}) {
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to access custom gpt');
  }
  return dbDeleteCustomGptByIdAndUserId({ gptId: customGptId, userId });
}
