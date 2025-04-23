'use server';

import { getUser } from '@/auth/utils';
import { db } from '@/db';
import { dbGetRelatedCustomGptFiles } from '@/db/functions/files';
import { CustomGptFileMapping, customGptTable, FileModel, fileTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

export async function createNewCustomGptAction() {
  const user = await getUser();

  const insertedCustomGpt = (
    await db
      .insert(customGptTable)
      .values({
        name: '',
        systemPrompt: '',
        userId: user.id,
        schoolId: user.school.id,
        description: '',
        specification: '',
        promptSuggestions: [],
      })
      .returning()
  )[0];

  if (insertedCustomGpt === undefined) {
    throw Error('Could not create a new CustomGpt');
  }

  return insertedCustomGpt;
}

export async function deleteFileMappingAndEntity({ fileId }: { fileId: string }) {
  const user = await getUser();
  await db.delete(CustomGptFileMapping).where(eq(CustomGptFileMapping.fileId, fileId)),
    await db.delete(fileTable).where(eq(fileTable.id, fileId));
}

export async function fetchFileMapping(id: string): Promise<FileModel[]> {
  const user = await getUser();
  if (user === undefined) return [];
  return await dbGetRelatedCustomGptFiles(id);
}

export async function linkFileToCustomGpt({
  fileId,
  customGpt,
}: {
  fileId: string;
  customGpt: string;
}) {
  const user = await getUser();
  const [insertedFileMapping] = await db
    .insert(CustomGptFileMapping)
    .values({ customGptId: customGpt, fileId: fileId })
    .returning();
  if (insertedFileMapping === undefined) {
    throw new Error('Could not Link file to character');
  }
}
