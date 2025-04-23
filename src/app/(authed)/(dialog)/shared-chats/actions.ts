'use server';
import { db } from '@/db';
import { SharedSchoolConversationFileMapping, sharedSchoolConversationTable } from '@/db/schema';
import { getUser } from '@/auth/utils';
import { and, eq } from 'drizzle-orm';

export async function deleteSharedChatAction({ id }: { id: string }) {
  const user = await getUser();

  const deletedSharedChat = (
    await db
      .delete(sharedSchoolConversationTable)
      .where(
        and(
          eq(sharedSchoolConversationTable.id, id),
          eq(sharedSchoolConversationTable.userId, user.id),
        ),
      )
      .returning()
  )[0];

  if (deletedSharedChat === undefined) {
    throw Error('Could not delete the shared chat.');
  }

  return deletedSharedChat;
}

export async function linkFileToSharedSchoolChat({
  fileId,
  schoolChatId,
}: {
  fileId: string;
  schoolChatId: string;
}) {
  await getUser();
  const [insertedFileMapping] = await db
    .insert(SharedSchoolConversationFileMapping)
    .values({ sharedSchoolConversationId: schoolChatId, fileId: fileId })
    .returning();
  if (insertedFileMapping === undefined) {
    throw new Error('Could not Link file to shared School Chat');
  }
}
