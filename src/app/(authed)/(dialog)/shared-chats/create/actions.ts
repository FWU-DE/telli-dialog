'use server';

import { db } from '@/db';
import { SharedSchoolConversationInsertModel, sharedSchoolConversationTable } from '@/db/schema';
import { getUser } from '@/auth/utils';

export async function createNewSharedSchoolChatAction(
  data: Omit<SharedSchoolConversationInsertModel, 'userId'>,
) {
  const user = await getUser();

  if (user.school === undefined) {
    throw Error('User is not part of a school');
  }

  if (user.school.userRole !== 'teacher') {
    throw Error('Only a teacher can create shared chats');
  }

  const insertedSharedChat = (
    await db
      .insert(sharedSchoolConversationTable)
      .values({ ...data, userId: user.id })
      .returning()
  )[0];

  if (insertedSharedChat === undefined) {
    throw Error('Could not insert chat');
  }

  return insertedSharedChat;
}
