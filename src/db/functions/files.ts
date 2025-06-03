import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { db } from '..';
import {
  CharacterFileMapping,
  ConversationMessageFileMappingTable,
  conversationTable,
  CustomGptFileMapping,
  FileModel,
  FileModelAndContent,
  fileTable,
  SharedSchoolConversationFileMapping,
  TextChunkTable,
} from '../schema';

export async function link_file_to_conversation({
  conversationMessageId,
  conversationId,
  fileIds,
}: {
  conversationMessageId: string;
  conversationId: string;
  fileIds: string[];
}) {
  for (const fileId of fileIds) {
    await db
      .insert(ConversationMessageFileMappingTable)
      .values({ conversationMessageId, fileId, conversationId });
  }
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
    };
    const maybeFiles = resultMap.get(row.foreignId);
    if (maybeFiles == null) {
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

export async function dbDeleteFileAndDetachFromConversation(filesToDelete: string[]) {
  await db.transaction(async (tx) => {
    await tx
      .delete(ConversationMessageFileMappingTable)
      .where(inArray(ConversationMessageFileMappingTable.fileId, filesToDelete));
    await tx
      .delete(ConversationMessageFileMappingTable)
      .where(inArray(ConversationMessageFileMappingTable.fileId, filesToDelete));
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
