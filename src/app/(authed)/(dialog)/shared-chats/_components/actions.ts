'use server';

import { db } from '@/db';
import { sharedSchoolConversationTable, characterTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function checkSharedChatInviteCodeAction({ inviteCode }: { inviteCode: string }) {
  const maybeSharedChat = (
    await db
      .select()
      .from(sharedSchoolConversationTable)
      .where(eq(sharedSchoolConversationTable.inviteCode, inviteCode))
  )[0];

  return maybeSharedChat;
}

export async function checkCharacterChatInviteCodeAction({ inviteCode }: { inviteCode: string }) {
  const maybeCharacterChat = (
    await db.select().from(characterTable).where(eq(characterTable.inviteCode, inviteCode))
  )[0];

  return maybeCharacterChat;
}
