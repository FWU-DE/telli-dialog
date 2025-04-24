'use server';
import { db } from '@/db';
import { SharedSchoolConversationFileMapping, sharedSchoolConversationTable } from '@/db/schema';
import { getUser } from '@/auth/utils';
import { and, eq } from 'drizzle-orm';
import { dbDeleteSharedSchoolChatByIdAndUserId } from '@/db/functions/shared-school-chat';

export async function deleteSharedChatAction({ id }: { id: string }) {
  const user = await getUser();

  const deletedSharedChat = await dbDeleteSharedSchoolChatByIdAndUserId({ 
    sharedChatId: id, 
    userId: user.id 
  });

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
