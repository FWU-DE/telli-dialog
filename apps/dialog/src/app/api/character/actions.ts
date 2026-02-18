'use server';

import { requireValidInviteCode } from '@shared/sharing/get-chat-id-by-invite-code';
import { sendCharacterMessage } from './character-service';
import type { ChatMessage, SendMessageResult } from './character-service';

export type { ChatMessage, SendMessageResult } from './character-service';

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
