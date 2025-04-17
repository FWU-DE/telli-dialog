'use server';

import { db } from '@/db';
import {
  sharedSchoolConversationTable,
  characterTable,
  sharedCharacterConversation,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function checkSharedChatInviteCodeAction({ inviteCode }: { inviteCode: string }) {
  const maybeSharedChat = (
    await db
      .select()
      .from(sharedSchoolConversationTable)
      .where(eq(sharedSchoolConversationTable.inviteCode, inviteCode))
  )[0];
  if (maybeSharedChat === undefined) return undefined;
  return { id: maybeSharedChat?.id, inviteCode: maybeSharedChat?.inviteCode };
}

export async function checkCharacterChatInviteCodeAction({ inviteCode }: { inviteCode: string }) {
  const maybeCharacterChat = (
    await db
      .select()
      .from(sharedCharacterConversation)
      .where(eq(sharedCharacterConversation.inviteCode, inviteCode))
  )[0];
  if (maybeCharacterChat === undefined) return undefined;
  return { id: maybeCharacterChat?.characterId, inviteCode: maybeCharacterChat?.inviteCode };
}
