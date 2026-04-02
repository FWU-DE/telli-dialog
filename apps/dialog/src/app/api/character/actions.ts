'use server';
import { requireValidInviteCode } from '@/auth/requireValidInviteCode';
import { sendCharacterMessage } from './character-chat-service';
import { ChatMessage, SendMessageResult, createErrorResult } from '@/types/chat';
import { SharedChatExpiredError } from '@telli/ai-core/errors';

export type { ChatMessage, SendMessageResult } from '@/types/chat';

export async function sendCharacterMessageAction({
  characterId,
  inviteCode,
  messages,
  modelId,
}: {
  characterId: string;
  inviteCode: string;
  messages: ChatMessage[];
  modelId: string;
}): Promise<SendMessageResult> {
  try {
    await requireValidInviteCode(inviteCode);
  } catch {
    return createErrorResult(new SharedChatExpiredError());
  }

  return sendCharacterMessage({
    characterId,
    inviteCode,
    messages,
    modelId,
  });
}
