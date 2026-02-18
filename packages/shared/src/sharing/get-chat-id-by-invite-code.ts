import { redirect } from 'next/navigation';
import { db } from '@shared/db';
import { eq } from 'drizzle-orm';
import { sharedCharacterConversation, sharedLearningScenarioTable } from '@shared/db/schema';
import { NotFoundError } from '@shared/error';

export type ChatInfo = {
  type: 'learning-scenario' | 'character';
  id: string;
  inviteCode: string;
};

export async function requireValidInviteCode(inviteCode: string): Promise<{ chatInfo: ChatInfo }> {
  try {
    const chatInfo = await getChatIdByInviteCode(inviteCode);
    return { chatInfo };
  } catch (error) {
    redirect('/login');
  }
}

export async function getChatIdByInviteCode(inviteCode: string): Promise<ChatInfo> {
  const [maybeSharedChat, maybeCharacterChat] = await Promise.all([
    tryGetLearningScenarioIdByInviteCode({ inviteCode }),
    tryGetCharacterIdByInviteCode({ inviteCode }),
  ]);

  if (maybeSharedChat !== undefined) {
    return { type: 'learning-scenario', ...maybeSharedChat };
  }
  if (maybeCharacterChat !== undefined) {
    return { type: 'character', ...maybeCharacterChat };
  }

  throw new NotFoundError('Chat with the provided invite code was not found.');
}

async function tryGetLearningScenarioIdByInviteCode({ inviteCode }: { inviteCode: string }) {
  const [maybeSharedChat] = await db
    .select()
    .from(sharedLearningScenarioTable)
    .where(eq(sharedLearningScenarioTable.inviteCode, inviteCode));
  if (maybeSharedChat?.inviteCode)
    return { id: maybeSharedChat.learningScenarioId, inviteCode: maybeSharedChat.inviteCode };

  return undefined;
}

async function tryGetCharacterIdByInviteCode({ inviteCode }: { inviteCode: string }) {
  const [maybeCharacterChat] = await db
    .select()
    .from(sharedCharacterConversation)
    .where(eq(sharedCharacterConversation.inviteCode, inviteCode));
  if (maybeCharacterChat?.inviteCode)
    return { id: maybeCharacterChat.characterId, inviteCode: maybeCharacterChat.inviteCode };

  return undefined;
}
