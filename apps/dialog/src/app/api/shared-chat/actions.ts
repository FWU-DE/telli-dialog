
'use server';
import { requireValidInviteCode } from '@/auth/requireValidInviteCode';
import { sendSharedChatMessage } from './shared-chat-service';
import { ChatMessage, SendMessageResult } from '@/types/chat';

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
  await requireValidInviteCode(inviteCode);

  return sendSharedChatMessage({
    sharedChatId,
    inviteCode,
    messages,
    modelId,
  });
}
