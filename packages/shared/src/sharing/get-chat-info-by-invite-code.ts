import { db } from '@shared/db';
import { and, eq, isNotNull } from 'drizzle-orm';
import { sharedCharacterConversation, sharedLearningScenarioTable } from '@shared/db/schema';
import { NotFoundError } from '@shared/error';

export type ChatInfo = {
  type: 'learning-scenario' | 'character';
  id: string;
  inviteCode: string;
};

export async function getChatInfoByInviteCode(inviteCode: string): Promise<ChatInfo> {
  const [maybeSharedChatId, maybeCharacterChatId] = await Promise.all([
    tryGetLearningScenarioIdByInviteCode({ inviteCode }),
    tryGetCharacterIdByInviteCode({ inviteCode }),
  ]);

  if (maybeSharedChatId !== undefined) {
    return { type: 'learning-scenario', id: maybeSharedChatId, inviteCode };
  }
  if (maybeCharacterChatId !== undefined) {
    return { type: 'character', id: maybeCharacterChatId, inviteCode };
  }

  throw new NotFoundError('Chat with the provided invite code was not found.');
}

async function tryGetLearningScenarioIdByInviteCode({ inviteCode }: { inviteCode: string }) {
  const [maybeSharedChat] = await db
    .select()
    .from(sharedLearningScenarioTable)
    .where(
      and(
        eq(sharedLearningScenarioTable.inviteCode, inviteCode),
        isNotNull(sharedLearningScenarioTable.startedAt),
      ),
    );
  return maybeSharedChat?.learningScenarioId;
}

async function tryGetCharacterIdByInviteCode({ inviteCode }: { inviteCode: string }) {
  const [maybeCharacterChat] = await db
    .select()
    .from(sharedCharacterConversation)
    .where(
      and(
        eq(sharedCharacterConversation.inviteCode, inviteCode),
        isNotNull(sharedCharacterConversation.startedAt),
      ),
    );
  return maybeCharacterChat?.characterId;
}
