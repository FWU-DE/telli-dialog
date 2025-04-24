import { eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { db } from '..';
import {
  CharacterFileMapping,
  conversationMessgaeFileMappingTable,
  conversationTable,
  CustomGptFileMapping,
  FileModel,
  FileModelAndContent,
  fileTable,
  SharedSchoolConversationFileMapping,
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
      .insert(conversationMessgaeFileMappingTable)
      .values({ conversationMessageId, fileId, conversationId });
  }
}

export async function dbGetRelatedFiles(conversationId: string): Promise<Map<string, FileModel[]>> {
  const files = await db
    .select({
      foreignId: conversationMessgaeFileMappingTable.conversationMessageId,
      fileId: conversationMessgaeFileMappingTable.fileId,
      name: fileTable.name,
      type: fileTable.type,
      size: fileTable.size,
      createdAt: fileTable.createdAt,
    })
    .from(conversationMessgaeFileMappingTable)
    .innerJoin(fileTable, eq(conversationMessgaeFileMappingTable.fileId, fileTable.id))
    .where(eq(conversationMessgaeFileMappingTable.conversationId, conversationId));

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
}) {
  const combinedFiles = await Promise.all([
    dbGetRelatedSharedChatFiles(sharedChatId),
    dbGetRelatedCharacterFiles(characterId),
    dbGetAllFileIdByConversationId(conversationId),
    dbGetRelatedCustomGptFiles(customGptId),
  ]);
  return combinedFiles.flat();
}

export async function dbGetAllFileIdByConversationId(conversationId?: string): Promise<FileModel[]> {
  if (conversationId === undefined) return [];
  const fileMappings = await db
    .select()
    .from(conversationMessgaeFileMappingTable)
    .where(eq(conversationMessgaeFileMappingTable.conversationId, conversationId))
    .innerJoin(fileTable, eq(conversationMessgaeFileMappingTable.fileId, fileTable.id))
    .orderBy(conversationMessgaeFileMappingTable.createdAt);
    return fileMappings.map((row)=>row.file_table);
}

export async function dbGetDanglingFileIds() {
  const fileIds = await db
    .select({ fileId: conversationMessgaeFileMappingTable.fileId })
    .from(conversationMessgaeFileMappingTable)
    .innerJoin(
      conversationTable,
      eq(conversationTable.id, conversationMessgaeFileMappingTable.conversationId),
    )
    .where(isNotNull(conversationTable.deletedAt));
  return fileIds;
}

export async function dbDeleteFileAndDetachFromConversation(filesToDelete: string[]) {
  await db
    .delete(conversationMessgaeFileMappingTable)
    .where(inArray(conversationMessgaeFileMappingTable.fileId, filesToDelete));
  await db.delete(fileTable).where(inArray(fileTable.id, filesToDelete));
}

export async function dbDeleteDanglingFiles() {
  const fileIds = await db
    .select({ fileId: fileTable.id })
    .from(fileTable)
    .leftJoin(
      conversationMessgaeFileMappingTable,
      eq(fileTable.id, conversationMessgaeFileMappingTable.fileId),
    )
    .where(isNull(conversationMessgaeFileMappingTable.fileId));

  await db.delete(fileTable).where(
    inArray(
      fileTable.id,
      fileIds.map((f) => f.fileId),
    ),
  );
}
