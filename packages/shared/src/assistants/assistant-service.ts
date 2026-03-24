import { UserModel } from '@shared/auth/user-model';
import {
  getConversation,
  getConversationMessages,
} from '@shared/conversation/conversation-service';
import { db } from '@shared/db';
import {
  dbDeleteAssistantByIdAndUserId,
  dbGetAssistantById,
  dbGetGlobalGpts,
  dbGetGptsBySchoolId,
  dbGetGptsByUserId,
  dbInsertAssistantFileMapping,
} from '@shared/db/functions/assistants';
import { dbGetRelatedAssistantFiles } from '@shared/db/functions/files';
import {
  AccessLevel,
  accessLevelSchema,
  AssistantFileMapping,
  AssistantSelectModel,
  assistantTable,
  assistantUpdateSchema,
  FileModel,
  fileTable,
} from '@shared/db/schema';
import { checkParameterUUID, ForbiddenError } from '@shared/error';
import { deleteAvatarPicture, deleteMessageAttachments } from '@shared/files/fileService';
import { copyFileInS3, uploadFileToS3 } from '@shared/s3';
import { copyAssistant, copyRelatedTemplateFiles } from '@shared/templates/template-service';
import { addDays } from '@shared/utils/date';
import { generateUUID } from '@shared/utils/uuid';
import { and, eq, lt } from 'drizzle-orm';
import z from 'zod';

export function buildAssistantPictureKey(assistantId: string) {
  return `custom-gpts/${assistantId}/avatar`;
}

/**
 * Loads custom gpt for edit view.
 * Throws if the user is not authorized to access the custom gpt:
 * - NotFound if the custom gpt does not exist
 * - Forbidden if the custom gpt is private and the user is not the owner
 * - Forbidden if the custom gpt is school-level and the user is not in the same school (and not the owner)
 *
 * Link sharing bypass: If `hasLinkAccess` is true, access checks are skipped
 * and any authenticated user can view the custom gpt. Note that link sharing
 * only grants read-only access - editing is still restricted to the owner.
 */
export async function getAssistantForEditView({
  assistantId,
  schoolId,
  userId,
}: {
  assistantId: string;
  schoolId: string;
  userId: string;
}): Promise<AssistantSelectModel> {
  checkParameterUUID(assistantId);
  const assistant = await dbGetAssistantById({ assistantId });
  if (!assistant.hasLinkAccess) {
    if (assistant.accessLevel === 'private' && assistant.userId !== userId)
      throw new ForbiddenError('Not authorized to edit assistant');
    if (
      assistant.accessLevel === 'school' &&
      assistant.schoolId !== schoolId &&
      assistant.userId !== userId
    )
      throw new ForbiddenError('Not authorized to edit assistant');
  }

  return assistant;
}

/**
 * User starts a new chat with a custom gpt.
 * Conversation starts with the first message.
 * Throws NotFoundError if the custom gpt does not exist.
 * Throws ForbiddenError if the user is not authorized to use the custom gpt.
 *
 * Link sharing bypass: If `hasLinkAccess` is true, access checks are skipped
 * and any authenticated user can use the custom gpt for chat.
 */
export async function getAssistantForNewChat({
  assistantId,
  userId,
  schoolId,
}: {
  assistantId: string;
  userId: string;
  schoolId: string;
}) {
  checkParameterUUID(assistantId);
  const assistant = await dbGetAssistantById({
    assistantId,
  });
  if (!assistant.hasLinkAccess) {
    if (assistant.accessLevel === 'private' && assistant.userId !== userId)
      throw new ForbiddenError('Not authorized to use assistant');
    if (
      assistant.accessLevel === 'school' &&
      assistant.schoolId !== schoolId &&
      assistant.userId !== userId
    )
      throw new ForbiddenError('Not authorized to use assistant');
  }

  return assistant;
}

/**
 * Returns an existing conversation along with its messages and the associated custom gpt.
 * Throws NotFoundError if the custom gpt does not exist.
 * Throws NotFoundError if the conversation does not exist.
 * Throws ForbiddenError if the user is not the owner of the conversation.
 */
export async function getConversationWithMessagesAndAssistant({
  conversationId,
  assistantId,
  userId,
}: {
  conversationId: string;
  assistantId: string;
  userId: string;
}) {
  checkParameterUUID(assistantId, conversationId);
  const [assistant, conversation, messages] = await Promise.all([
    dbGetAssistantById({ assistantId }),
    getConversation({ conversationId, userId }),
    getConversationMessages({ conversationId, userId }),
  ]);

  return { assistant, conversation, messages };
}

/**
 * Returns a list of custom gpts for the user based on
 * userId, schoolId, federalStateId and access level.
 */
export async function getAssistantByAccessLevel({
  accessLevel,
  schoolId,
  userId,
  federalStateId,
}: {
  accessLevel: AccessLevel;
  schoolId: string;
  userId: string;
  federalStateId: string;
}): Promise<AssistantSelectModel[]> {
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
export async function createNewAssistant({
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
  if (user.userRole !== 'teacher') throw new ForbiddenError('Not authorized to create assistant');

  if (templateId !== undefined) {
    let insertedAssistant = await copyAssistant(templateId, 'private', user.id, schoolId);

    if (templatePictureId !== undefined) {
      const copyOfTemplatePicture = buildAssistantPictureKey(insertedAssistant.id);
      await copyFileInS3({
        newKey: copyOfTemplatePicture,
        copySource: templatePictureId,
      });

      // Update the assistant with the new picture
      const [updatedAssistant] = await db
        .update(assistantTable)
        .set({ pictureId: copyOfTemplatePicture })
        .where(eq(assistantTable.id, insertedAssistant.id))
        .returning();

      if (updatedAssistant) {
        insertedAssistant = updatedAssistant;
      }
    }

    await copyRelatedTemplateFiles('custom-gpt', templateId, insertedAssistant.id);
    return insertedAssistant;
  }

  const assistantId = generateUUID();

  const [insertedAssistant] = await db
    .insert(assistantTable)
    .values({
      id: assistantId,
      name: '',
      systemPrompt: '',
      userId: user.id,
      schoolId: schoolId,
      description: '',
      instructions: '',
      promptSuggestions: [],
    })
    .returning();

  if (!insertedAssistant) {
    throw Error('Could not create a new assistant');
  }

  return insertedAssistant;
}

/**
 * Link a file to a custom gpt.
 * Throws if the user is not the owner of the custom gpt.
 */
export async function linkFileToAssistant({
  fileId,
  assistantId,
  userId,
}: {
  fileId: string;
  assistantId: string;
  userId: string;
}) {
  checkParameterUUID(assistantId);
  const assistant = await dbGetAssistantById({ assistantId });
  if (assistant.userId !== userId) {
    throw new ForbiddenError('Not authorized to add new file to this assistant');
  }

  const insertedFileMapping = await dbInsertAssistantFileMapping({
    assistantId,
    fileId: fileId,
  });

  if (!insertedFileMapping) {
    throw new Error('Could not link file to assistant');
  }
}

/**
 * Delete file mapping and the file entity itself from database.
 * Also deletes the actual file from S3.
 * Throws if the user is not the owner of the custom gpt.
 */
export async function deleteFileMappingAndEntity({
  assistantId,
  fileId,
  userId,
}: {
  assistantId: string;
  fileId: string;
  userId: string;
}) {
  checkParameterUUID(assistantId);
  const assistant = await dbGetAssistantById({ assistantId });
  if (assistant.userId !== userId) {
    throw new ForbiddenError('Not authorized to delete this file mapping from assistant');
  }

  // delete mapping and file entry in db
  await db.transaction(async (tx) => {
    await tx.delete(AssistantFileMapping).where(eq(AssistantFileMapping.fileId, fileId));
    await tx.delete(fileTable).where(eq(fileTable.id, fileId));
  });

  // Delete the file from S3
  await deleteMessageAttachments([fileId]);
}

/**
 * Get file mappings for a custom gpt.
 * Throws if the user is not authorized to access the custom gpt:
 * - NotFound if the custom gpt does not exist
 * - Forbidden if the custom gpt is private and the user is not the owner
 * - Forbidden if the custom gpt is school-level and the user is not in the same school
 */
export async function getFileMappings({
  assistantId,
  schoolId,
  userId,
}: {
  assistantId: string;
  schoolId: string;
  userId: string;
}): Promise<FileModel[]> {
  checkParameterUUID(assistantId);
  const assistant = await dbGetAssistantById({ assistantId });
  if (!assistant.hasLinkAccess) {
    if (assistant.accessLevel === 'private' && assistant.userId !== userId) {
      throw new ForbiddenError('Not authorized to access assistant');
    }
    if (
      assistant.accessLevel === 'school' &&
      assistant.schoolId !== schoolId &&
      assistant.userId !== userId
    ) {
      throw new ForbiddenError('Not authorized to access assistant');
    }
  }

  return await dbGetRelatedAssistantFiles(assistantId);
}

/**
 * Update access level, e.g. from private to school or back to private.
 * Global access level is not allowed for this use case.
 * Throws if the user is not the owner of the custom gpt.
 */
export async function updateAssistantAccessLevel({
  accessLevel,
  assistantId,
  userId,
}: {
  accessLevel: AccessLevel;
  assistantId: string;
  userId: string;
}) {
  checkParameterUUID(assistantId);
  accessLevelSchema.parse(accessLevel);

  // Authorization check
  if (accessLevel === 'global') {
    throw new ForbiddenError('Not authorized to set the access level to global');
  }

  const assistant = await dbGetAssistantById({ assistantId });
  if (assistant.userId !== userId) {
    throw new ForbiddenError('Not authorized to update assistant');
  }

  const [updatedAssistant] = await db
    .update(assistantTable)
    .set({ accessLevel })
    .where(and(eq(assistantTable.id, assistantId), eq(assistantTable.userId, userId)))
    .returning();

  if (!updatedAssistant) {
    throw new Error('Could not update the access level of the assistant');
  }

  return updatedAssistant;
}

/**
 * Set a new picture for the custom gpt.
 * Throws if the user is not the owner of the custom gpt.
 */
export async function updateAssistantPicture({
  assistantId,
  picturePath,
  userId,
}: {
  assistantId: string;
  picturePath: string;
  userId: string;
}) {
  checkParameterUUID(assistantId);
  const assistant = await dbGetAssistantById({ assistantId });
  if (assistant.userId !== userId) {
    throw new ForbiddenError('Not authorized to update this assistant');
  }

  const [updatedAssistant] = await db
    .update(assistantTable)
    .set({ pictureId: picturePath })
    .where(and(eq(assistantTable.id, assistantId), eq(assistantTable.userId, userId)))
    .returning();

  if (updatedAssistant === undefined) {
    throw new Error('Could not update the picture of the assistant');
  }

  return updatedAssistant;
}

const updateAssistantSchema = assistantUpdateSchema.omit({
  id: true,
  pictureId: true,
  isDeleted: true,
  originalAssistantId: true,
  accessLevel: true,
});

/**
 * Update assistant properties.
 * Throws if the user is not the owner of the assistant.
 */
export async function updateAssistant({
  assistantId,
  userId,
  assistantProps,
}: {
  assistantId: string;
  userId: string;
  assistantProps: z.infer<typeof updateAssistantSchema>;
}) {
  const assistant = await dbGetAssistantById({ assistantId });
  if (assistant.userId !== userId) {
    throw new ForbiddenError('Not authorized to update this assistant');
  }

  const parsedValues = updateAssistantSchema.parse(assistantProps);

  const [updatedAssistant] = await db
    .update(assistantTable)
    .set(parsedValues)
    .where(and(eq(assistantTable.id, assistantId), eq(assistantTable.userId, userId)))
    .returning();

  if (!updatedAssistant) {
    throw new Error('Could not update the assistant');
  }

  return updatedAssistant;
}

/**
 * Deletes an assistant.
 * Throws if the user is not the owner of the assistant.
 * Also deletes all related files and the avatar picture from S3.
 */
export async function deleteAssistant({
  assistantId,
  userId,
}: {
  assistantId: string;
  userId: string;
}) {
  checkParameterUUID(assistantId);
  const assistant = await dbGetAssistantById({ assistantId });
  if (assistant.userId !== userId) {
    throw new ForbiddenError('Not authorized to delete this assistant');
  }

  const relatedFiles = await dbGetRelatedAssistantFiles(assistantId);

  // delete assistant from db
  const deletedAssistant = await dbDeleteAssistantByIdAndUserId({ gptId: assistantId, userId });

  // delete avatar picture from S3
  await deleteAvatarPicture(assistant.pictureId);

  // delete all related files from s3
  await deleteMessageAttachments(relatedFiles.map((file) => file.id));

  return deletedAssistant;
}

/**
 * Cleans up custom gpts with empty names from the database.
 *
 * CAUTION: This is an admin function that does not check any authorization!
 *
 * Note: linked files will be unlinked but removed separately by `dbDeleteDanglingFiles`
 *
 * @returns number of deleted custom gpts in db.
 */
export async function cleanupAssistants() {
  const result = await db
    .delete(assistantTable)
    .where(and(eq(assistantTable.name, ''), lt(assistantTable.createdAt, addDays(new Date(), -1))))
    .returning();
  return result.length;
}

export async function uploadAvatarPictureForAssistant({
  assistantId,
  croppedImageBlob,
  userId,
}: {
  assistantId: string;
  croppedImageBlob: Blob;
  userId: string;
}) {
  const assistant = await dbGetAssistantById({ assistantId });
  if (assistant.userId !== userId) {
    throw new ForbiddenError('Not authorized to update avatar picture for this assistant');
  }

  const key = buildAssistantPictureKey(assistantId);

  await uploadFileToS3({
    key: key,
    body: croppedImageBlob,
    contentType: croppedImageBlob.type,
  });

  return key;
}
