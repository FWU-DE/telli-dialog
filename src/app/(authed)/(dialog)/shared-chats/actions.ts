'use server';
import { db } from '@/db';
import { sharedSchoolConversationTable } from '@/db/schema';
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
