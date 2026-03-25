'use server';
import { requireValidInviteCode } from '@/auth/requireValidInviteCode';
import { sendSharedChatMessage } from './shared-chat-service';
import { ChatMessage, SendMessageResult, createErrorResult } from '@/types/chat';
import { SharedChatExpiredError } from '@telli/ai-core/errors';

export type { ChatMessage, SendMessageResult } from '@/types/chat';

export async function sendSharedChatMessageAction({
  sharedChatId,
  inviteCode,
  messages,
  modelId,
}: {
  sharedChatId: string;
  inviteCode: string;
  messages: ChatMessage[];
  modelId: string;
}): Promise<SendMessageResult> {
  try {
    await requireValidInviteCode(inviteCode);
  } catch {
    return createErrorResult(new SharedChatExpiredError());
  }

  return sendSharedChatMessage({
    sharedChatId,
    inviteCode,
    messages,
    modelId,
  });
}
