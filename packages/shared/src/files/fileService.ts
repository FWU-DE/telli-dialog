import { eq } from 'drizzle-orm';
import { db } from '@shared/db';
import {
  CharacterFileMapping,
  CustomGptFileMapping,
  fileTable,
  TextChunkTable,
} from '@shared/db/schema';
import { copyFileInS3, deleteFileFromS3 } from '@shared/s3';
import { cnanoid } from '../random/randomService';

const MESSAGE_ATTACHMENTS_FOLDER_NAME = 'message_attachments';

/**
 * Duplicates a file and all its related text chunks and embeddings.
 * This preserves all existing processing (embeddings, chunks, metadata) while creating
 * a clean copy with a new file ID.
 *
 * @param originalFileId - The ID of the original file to duplicate
 * @returns Promise with the new file ID
 */
export async function duplicateFileWithEmbeddings(originalFileId: string): Promise<string> {
  const newFileId = `file_${cnanoid()}`;

  try {
    // Get original file record
    const [originalFile] = await db
      .select()
      .from(fileTable)
      .where(eq(fileTable.id, originalFileId));
    if (!originalFile) {
      throw new Error(`Original file not found: ${originalFileId}`);
    }

    // Get all text chunks for the original file
    const originalChunks = await db
      .select()
      .from(TextChunkTable)
      .where(eq(TextChunkTable.fileId, originalFileId));

    // Copy the original file from S3
    await copyFileInS3({
      copySource: `message_attachments/${originalFileId}`,
      newKey: `message_attachments/${newFileId}`,
    });

    // Create database records in a transaction
    await db.transaction(async (tx) => {
      // Create new file record with new ID
      await tx.insert(fileTable).values({
        ...originalFile,
        id: newFileId,
      });

      // Copy all chunks with new file ID (remove id to let DB generate new ones)
      if (originalChunks.length > 0) {
        const newChunks = originalChunks.map((chunk) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = chunk;
          return {
            ...rest,
            fileId: newFileId,
          };
        });
        await tx.insert(TextChunkTable).values(newChunks);
      }
    });

    return newFileId;
  } catch (error) {
    console.error(`Error copying file from ${originalFileId}:`, error);
    throw new Error(
      `Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error },
    );
  }
}

/**
 * Links a file to a character by creating a mapping record.
 *
 * @param fileId - The ID of the file to link
 * @param characterId - The ID of the character to link to
 */
export async function linkFileToCharacter(fileId: string, characterId: string): Promise<void> {
  await db.insert(CharacterFileMapping).values({
    fileId,
    characterId,
  });
}

/**
 * Links a file to a custom GPT by creating a mapping record.
 *
 * @param fileId - The ID of the file to link
 * @param customGptId - The ID of the custom GPT to link to
 */
export async function linkFileToCustomGpt(fileId: string, customGptId: string): Promise<void> {
  await db.insert(CustomGptFileMapping).values({
    fileId,
    customGptId,
  });
}

/**
 * Deletes a file in the message attachments path in S3.
 * CAUTION: This function does not check any permissions.
 */
export async function deleteMessageAttachment({ fileId }: { fileId: string }): Promise<void> {
  const filePath = `${MESSAGE_ATTACHMENTS_FOLDER_NAME}/${fileId}`;
  await deleteFileFromS3({ key: filePath });
}
