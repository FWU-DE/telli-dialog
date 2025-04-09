import { eq, inArray } from 'drizzle-orm';
import { db } from '..';
import { conversationMessgaeFileMappingTable, FileModel, FileModelAndContent, fileTable } from '../schema';

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
      conversationMessageId: conversationMessgaeFileMappingTable.conversationMessageId,
      fileId: conversationMessgaeFileMappingTable.fileId,
      name: fileTable.name,
      type: fileTable.type,
      size: fileTable.size,
      createdAt: fileTable.createdAt
    })
    .from(conversationMessgaeFileMappingTable)
    .innerJoin(fileTable, eq(conversationMessgaeFileMappingTable.fileId, fileTable.id))
    .where(eq(conversationMessgaeFileMappingTable.conversationId, conversationId));

  const resultMap: Map<string, FileModel[]> = new Map();
  for (const row of files){
    const file = {id: row.fileId, name: row.name, size: row.size, createdAt: row.createdAt, type: row.type}
    let maybeFiles = resultMap.get(row.conversationMessageId)
    if (maybeFiles == null){
      resultMap.set(row.conversationMessageId, [file])
    }
    if (maybeFiles !== undefined){
      maybeFiles.push(file)
    }

  }
  return resultMap;
}

export async function dbGetFilesInIds(fileIds:string[]): Promise<FileModelAndContent[]> {
  const maybeFiles = await db.select().from(fileTable).where(inArray(fileTable.id, fileIds));
  return [...maybeFiles]
}

export async function dbGetAllFileIdByConversationId(conversationId:string) {
  const fileMappings = await db.select().from(conversationMessgaeFileMappingTable).where(eq(conversationMessgaeFileMappingTable.conversationId, conversationId)).orderBy(conversationMessgaeFileMappingTable.createdAt);
  return fileMappings.map(
    (row) => row.fileId
  )
}
