'use server';

import { requireValidInviteCode } from '@/auth/requireValidInviteCode';
import { sendSharedChatMessage } from './shared-chat-service';
import type { ChatMessage, SendMessageResult } from './shared-chat-service';

export type { ChatMessage, SendMessageResult } from './shared-chat-service';

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
