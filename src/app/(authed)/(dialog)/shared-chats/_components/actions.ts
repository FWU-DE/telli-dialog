'use server';

import { db } from '@/db';
import { sharedSchoolConversationTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function checkSharedChatInviteCodeAction({ inviteCode }: { inviteCode: string }) {
  const maybeSharedChat = (
    await db
      .select()
      .from(sharedSchoolConversationTable)
      .where(eq(sharedSchoolConversationTable.inviteCode, inviteCode))
  )[0];

  if (maybeSharedChat === undefined) {
    throw Error('Could not find shared chat with this invite code');
  }

  return maybeSharedChat;
}
