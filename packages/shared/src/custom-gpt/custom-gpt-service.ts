import { UserModel } from '@shared/auth/user-model';
import {
  getConversation,
  getConversationMessages,
} from '@shared/conversation/conversation-service';
import { db } from '@shared/db';
import {
  dbDeleteCustomGptByIdAndUserId,
  dbGetCustomGptById,
  dbGetGlobalGpts,
  dbGetGptsBySchoolId,
  dbGetGptsByUserId,
  dbInsertCustomGptFileMapping,
} from '@shared/db/functions/custom-gpts';
import { dbGetRelatedCustomGptFiles } from '@shared/db/functions/files';
import {
  AccessLevel,
  accessLevelSchema,
  CustomGptFileMapping,
  CustomGptSelectModel,
  customGptTable,
  customGptUpdateSchema,
  FileModel,
  fileTable,
} from '@shared/db/schema';
import { checkParameterUUID, ForbiddenError } from '@shared/error';
import { copyFileInS3 } from '@shared/s3';
import { copyCustomGpt, copyRelatedTemplateFiles } from '@shared/templates/templateService';
import { addDays } from '@shared/utils/date';
import { generateUUID } from '@shared/utils/uuid';
import { and, eq, lt } from 'drizzle-orm';
import z from 'zod';

/**
 * Loads custom gpt for edit view.
 * Throws if the user is not authorized to access the custom gpt:
 * - NotFound if the custom gpt does not exist
 * - Forbidden if the custom gpt is private and the user is not the owner
 * - Forbidden if the custom gpt is school-level and the user is not in the same school
 */
export async function getCustomGptForEditView({
  customGptId,
  schoolId,
  userId,
}: {
  customGptId: string;
  schoolId: string;
  userId: string;
}) {
  checkParameterUUID(customGptId);
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.accessLevel === 'private' && customGpt.userId !== userId)
    throw new ForbiddenError('Not authorized to edit custom gpt');
  if (
    customGpt.accessLevel === 'school' &&
    customGpt.schoolId !== schoolId &&
    customGpt.userId !== userId
  )
    throw new ForbiddenError('Not authorized to edit custom gpt');

  return customGpt;
}

/**
 * User starts a new chat with a custom gpt.
 * Conversation starts with the first message.
 * Throws NotFoundError if the custom gpt does not exist.
 * Throws ForbiddenError if the user is not authorized to use the custom gpt.
 */
export async function getCustomGptForNewChat({
  customGptId,
  userId,
  schoolId,
}: {
  customGptId: string;
  userId: string;
  schoolId: string;
}) {
  checkParameterUUID(customGptId);
  const customGpt = await dbGetCustomGptById({
    customGptId,
  });
  if (customGpt.accessLevel === 'private' && customGpt.userId !== userId)
    throw new ForbiddenError('Not authorized to use custom gpt');
  if (
    customGpt.accessLevel === 'school' &&
    customGpt.schoolId !== schoolId &&
    customGpt.userId !== userId
  )
    throw new ForbiddenError('Not authorized to use custom gpt');

  return customGpt;
}

/**
 * Returns an existing conversation along with its messages and the associated custom gpt.
 * Throws NotFoundError if the custom gpt does not exist.
 * Throws NotFoundError if the conversation does not exist.
 * Throws ForbiddenError if the user is not the owner of the conversation.
 */
export async function getConversationWithMessagesAndCustomGpt({
  conversationId,
  customGptId,
  userId,
}: {
  conversationId: string;
  customGptId: string;
  userId: string;
}) {
  checkParameterUUID(customGptId, conversationId);
  const [customGpt, conversation, messages] = await Promise.all([
    dbGetCustomGptById({ customGptId }),
    getConversation({ conversationId, userId }),
    getConversationMessages({ conversationId, userId }),
  ]);

  return { customGpt, conversation, messages };
}

/**
 * Returns a list of custom gpts for the user based on
 * userId, schoolId, federalStateId and access level.
 */
export async function getCustomGptByAccessLevel({
  accessLevel,
  schoolId,
  userId,
  federalStateId,
}: {
  accessLevel: AccessLevel;
  schoolId: string;
  userId: string;
  federalStateId: string;
}): Promise<CustomGptSelectModel[]> {
  if (accessLevel === 'global') {
    return await dbGetGlobalGpts({ federalStateId });
  } else if (accessLevel === 'school') {
    return await dbGetGptsBySchoolId({ schoolId });
  } else if (accessLevel === 'private') {
    return await dbGetGptsByUserId({ userId });
  }
  return [];
}

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

  if (!insertedCustomGpt) {
    throw Error('Could not create a new custom gpt');
  }

  return insertedCustomGpt;
}

/**
 * Link a file to a custom gpt.
 * Throws if the user is not the owner of the custom gpt.
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
  checkParameterUUID(customGptId);
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to add new file to this custom gpt');
  }

  const insertedFileMapping = await dbInsertCustomGptFileMapping({
    customGptId,
    fileId: fileId,
  });

  if (!insertedFileMapping) {
    throw new Error('Could not link file to custom gpt');
  }
}

/**
 * Delete file mapping and the file entity itself
 * Throws if the user is not the owner of the custom gpt.
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
  checkParameterUUID(customGptId);
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to delete this file mapping from custom gpt');
  }

  await db.transaction(async (tx) => {
    await tx.delete(CustomGptFileMapping).where(eq(CustomGptFileMapping.fileId, fileId));
    await tx.delete(fileTable).where(eq(fileTable.id, fileId));
  });
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
  checkParameterUUID(customGptId);
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
  accessLevel: AccessLevel;
  customGptId: string;
  userId: string;
}) {
  checkParameterUUID(customGptId);
  accessLevelSchema.parse(accessLevel);

  // Authorization check
  if (accessLevel === 'global') {
    throw new ForbiddenError('Not authorized to set the access level to global');
  }

  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to update custom gpt');
  }

  const [updatedCustomGpt] = await db
    .update(customGptTable)
    .set({ accessLevel })
    .where(and(eq(customGptTable.id, customGptId), eq(customGptTable.userId, userId)))
    .returning();

  if (!updatedCustomGpt) {
    throw new Error('Could not update the access level of the customGpt');
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
  checkParameterUUID(customGptId);
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to update this custom gpt');
  }

  const [updatedCustomGpt] = await db
    .update(customGptTable)
    .set({ pictureId: picturePath })
    .where(and(eq(customGptTable.id, customGptId), eq(customGptTable.userId, userId)))
    .returning();

  if (updatedCustomGpt === undefined) {
    throw new Error('Could not update the picture of the custom gpt');
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
    throw new ForbiddenError('Not authorized to update this custom gpt');
  }

  const parsedValues = updateCustomGptSchema.parse(customGptProps);

  const [updatedGpt] = await db
    .update(customGptTable)
    .set(parsedValues)
    .where(and(eq(customGptTable.id, customGptId), eq(customGptTable.userId, userId)))
    .returning();

  if (!updatedGpt) {
    throw new Error('Could not update the custom gpt');
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
  checkParameterUUID(customGptId);
  const customGpt = await dbGetCustomGptById({ customGptId });
  if (customGpt.userId !== userId) {
    throw new ForbiddenError('Not authorized to delete this custom gpt');
  }
  return dbDeleteCustomGptByIdAndUserId({ gptId: customGptId, userId });
}

/**
 * Cleans up custom gpts with empty names from the database.
 * Attention: This is an admin function that does not check any authorization!
 *
 * Note: linked files will be unlinked but removed separately by `dbDeleteDanglingFiles`
 *
 * @returns number of deleted custom gpts in db.
 */
export async function cleanupCustomGpts() {
  const result = await db
    .delete(customGptTable)
    .where(and(eq(customGptTable.name, ''), lt(customGptTable.createdAt, addDays(new Date(), -1))))
    .returning();
  return result.length;
}
