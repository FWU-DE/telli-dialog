import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { db } from '..';
import {
  CharacterFileMapping,
  characterTable,
  ConversationMessageFileMappingTable,
  conversationTable,
  CustomGptFileMapping,
  customGptTable,
  federalStateTable,
  FileInsertModel,
  FileMetadata,
  FileModel,
  FileModelAndContent,
  fileTable,
  SharedSchoolConversationFileMapping,
  sharedSchoolConversationTable,
  TextChunkInsertModel,
  TextChunkTable,
} from '../schema';

export async function linkFilesToConversation({
  conversationMessageId,
  conversationId,
  fileIds,
}: {
  conversationMessageId: string;
  conversationId: string;
  fileIds: string[];
}) {
  if (fileIds.length === 0) return;
  await db
    .insert(ConversationMessageFileMappingTable)
    .values(fileIds.map((fileId) => ({ conversationMessageId, fileId, conversationId })));
}

export async function dbGetRelatedFiles(conversationId: string): Promise<Map<string, FileModel[]>> {
  const files = await db
    .select({
      foreignId: ConversationMessageFileMappingTable.conversationMessageId,
      fileId: ConversationMessageFileMappingTable.fileId,
      name: fileTable.name,
      type: fileTable.type,
      size: fileTable.size,
      createdAt: fileTable.createdAt,
      metadata: fileTable.metadata,
    })
    .from(ConversationMessageFileMappingTable)
    .innerJoin(fileTable, eq(ConversationMessageFileMappingTable.fileId, fileTable.id))
    .where(eq(ConversationMessageFileMappingTable.conversationId, conversationId));

  const resultMap = convertToMap(files);
  return resultMap;
}

export async function dbGetRelatedSharedChatFiles(conversationId?: string): Promise<FileModel[]> {
  if (conversationId === undefined) return [];
  const files = await db
    .select({
      id: SharedSchoolConversationFileMapping.fileId,
      name: fileTable.name,
      type: fileTable.type,
      size: fileTable.size,
      createdAt: fileTable.createdAt,
      metadata: fileTable.metadata,
    })
    .from(SharedSchoolConversationFileMapping)
    .innerJoin(fileTable, eq(SharedSchoolConversationFileMapping.fileId, fileTable.id))
    .where(eq(SharedSchoolConversationFileMapping.sharedSchoolConversationId, conversationId));

  return files;
}

export async function dbGetRelatedCharacterFiles(conversationId?: string): Promise<FileModel[]> {
  if (conversationId === undefined) return [];
  const files = await db
    .select({
      id: CharacterFileMapping.fileId,
      name: fileTable.name,
      type: fileTable.type,
      size: fileTable.size,
      createdAt: fileTable.createdAt,
      metadata: fileTable.metadata,
    })
    .from(CharacterFileMapping)
    .innerJoin(fileTable, eq(CharacterFileMapping.fileId, fileTable.id))
    .where(eq(CharacterFileMapping.characterId, conversationId));

  return files;
}

export async function dbGetRelatedCustomGptFiles(customGptId?: string): Promise<FileModel[]> {
  if (customGptId === undefined) return [];
  const files = await db
    .select({
      id: CustomGptFileMapping.fileId,
      name: fileTable.name,
      type: fileTable.type,
      size: fileTable.size,
      createdAt: fileTable.createdAt,
      metadata: fileTable.metadata,
    })
    .from(CustomGptFileMapping)
    .innerJoin(fileTable, eq(CustomGptFileMapping.fileId, fileTable.id))
    .where(eq(CustomGptFileMapping.customGptId, customGptId));

  return files;
}

function convertToMap(
  files: {
    foreignId: string;
    fileId: string;
    name: string;
    type: string;
    size: number;
    createdAt: Date;
    metadata: FileMetadata | null;
  }[],
) {
  const resultMap: Map<string, FileModel[]> = new Map();
  for (const row of files) {
    const file = {
      id: row.fileId,
      name: row.name,
      size: row.size,
      createdAt: row.createdAt,
      type: row.type,
      metadata: row.metadata,
    };
    const maybeFiles = resultMap.get(row.foreignId);
    if (maybeFiles === null || maybeFiles === undefined) {
      resultMap.set(row.foreignId, [file]);
    }
    if (maybeFiles !== undefined) {
      maybeFiles.push(file);
    }
  }
  return resultMap;
}

export async function dbGetFilesInIds(fileIds: string[]): Promise<FileModelAndContent[]> {
  const maybeFiles = await db.select().from(fileTable).where(inArray(fileTable.id, fileIds));
  return [...maybeFiles];
}

export async function dbGetAttachedFileByEntityId({
  conversationId,
  characterId,
  sharedChatId,
  customGptId,
}: {
  conversationId?: string;
  characterId?: string;
  sharedChatId?: string;
  customGptId?: string;
}): Promise<(FileModel & { conversationMessageId?: string })[]> {
  const combinedFiles = await Promise.all([
    dbGetRelatedSharedChatFiles(sharedChatId),
    dbGetRelatedCharacterFiles(characterId),
    dbGetAllFileIdByConversationId(conversationId),
    dbGetRelatedCustomGptFiles(customGptId),
  ]);
  return combinedFiles.flat();
}

export async function dbGetAllFileIdByConversationId(
  conversationId?: string,
): Promise<(FileModel & { conversationMessageId?: string })[]> {
  if (conversationId === undefined) return [];
  const fileMappings = await db
    .select()
    .from(ConversationMessageFileMappingTable)
    .where(eq(ConversationMessageFileMappingTable.conversationId, conversationId))
    .innerJoin(fileTable, eq(ConversationMessageFileMappingTable.fileId, fileTable.id))
    .orderBy(ConversationMessageFileMappingTable.createdAt);
  return fileMappings.map((row) => ({
    ...row.file_table,
    conversationMessageId: row.conversation_message_file_mapping.conversationMessageId,
  }));
}

export async function dbGetDanglingConversationFileIds(): Promise<string[]> {
  const fileMappings = await db
    .select({ fileId: ConversationMessageFileMappingTable.fileId })
    .from(ConversationMessageFileMappingTable)
    .innerJoin(
      conversationTable,
      eq(conversationTable.id, ConversationMessageFileMappingTable.conversationId),
    )
    .where(isNotNull(conversationTable.deletedAt));
  return fileMappings.map((row) => row.fileId);
}

export async function dbInsertFileWithTextChunks(
  file: FileInsertModel,
  textChunks: TextChunkInsertModel[],
) {
  await db.transaction(async (tx) => {
    await tx.insert(fileTable).values(file).onConflictDoNothing();
    if (textChunks.length > 0) {
      await tx.insert(TextChunkTable).values(textChunks);
    }
  });
}

export async function dbInsertFile(file: FileInsertModel) {
  await db.insert(fileTable).values(file).onConflictDoNothing();
}

export async function dbDeleteFileAndDetachFromConversation(filesToDelete: string[]) {
  await db.transaction(async (tx) => {
    await tx
      .delete(ConversationMessageFileMappingTable)
      .where(inArray(ConversationMessageFileMappingTable.fileId, filesToDelete));
    await tx.delete(TextChunkTable).where(inArray(TextChunkTable.fileId, filesToDelete));
    await tx.delete(fileTable).where(inArray(fileTable.id, filesToDelete));
  });
}

export async function dbDeleteDanglingFiles() {
  return await db.transaction(async (tx) => {
    const fileIds = await tx
      .select({ fileId: fileTable.id })
      .from(fileTable)
      .leftJoin(
        ConversationMessageFileMappingTable,
        eq(fileTable.id, ConversationMessageFileMappingTable.fileId),
      )
      .leftJoin(CharacterFileMapping, eq(fileTable.id, CharacterFileMapping.fileId))
      .leftJoin(CustomGptFileMapping, eq(fileTable.id, CustomGptFileMapping.fileId))
      .leftJoin(
        SharedSchoolConversationFileMapping,
        eq(fileTable.id, SharedSchoolConversationFileMapping.fileId),
      )
      .where(
        and(
          isNull(ConversationMessageFileMappingTable.fileId),
          isNull(CharacterFileMapping.fileId),
          isNull(CustomGptFileMapping.fileId),
          isNull(SharedSchoolConversationFileMapping.fileId),
        ),
      );
    const fileIdsToDelete = fileIds.map((f) => f.fileId);
    console.log('fileIdsToDelete', fileIdsToDelete);
    await tx.delete(TextChunkTable).where(inArray(TextChunkTable.fileId, fileIdsToDelete));
    await tx.delete(fileTable).where(inArray(fileTable.id, fileIdsToDelete));
    return fileIdsToDelete;
  });
}

/**
 * Returns all S3 keys for files which are referenced in the database in any table.
 */
export async function dbGetAllS3FileKeys(): Promise<string[]> {
  const [files, characters, customGpts, sharedSchoolConversations, federalStates] =
    await Promise.all([
      db.select({ fileId: fileTable.id }).from(fileTable),
      db
        .select({ id: characterTable.id, pictureId: characterTable.pictureId })
        .from(characterTable),
      db
        .select({ id: customGptTable.id, pictureId: customGptTable.pictureId })
        .from(customGptTable),
      db
        .select({
          id: sharedSchoolConversationTable.id,
          pictureId: sharedSchoolConversationTable.pictureId,
        })
        .from(sharedSchoolConversationTable),
      db.select({ id: federalStateTable.id }).from(federalStateTable),
    ]);

  const fileIds = files.map((x) => `message_attachments/${x.fileId}`);
  const pictureIds = [...characters, ...customGpts, ...sharedSchoolConversations]
    .map((x) => x.pictureId)
    .filter((x): x is string => !!x);
  const avatarIds = [
    ...characters.map((x) => `characters/${x.id}/avatar`),
    ...customGpts.map((x) => `custom-gpts/${x.id}/avatar`),
    ...sharedSchoolConversations.map((x) => `shared-chats/${x.id}/avatar`),
  ];
  const whitelabels = federalStates.flatMap((x) => [
    `whitelabels/${x.id}/logo.svg`,
    `whitelabels/${x.id}/favicon.svg`,
  ]);

  return [...fileIds, ...pictureIds, ...avatarIds, ...whitelabels];
}
