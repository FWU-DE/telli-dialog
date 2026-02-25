'use server';

import { requireValidInviteCode } from '@/auth/requireValidInviteCode';
import { sendCharacterMessage } from './character-chat-service';
import type { ChatMessage, SendMessageResult } from '@/types/chat';

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
  await requireValidInviteCode(inviteCode);

  return sendCharacterMessage({
    characterId,
    inviteCode,
    messages,
    modelId,
  });
}
