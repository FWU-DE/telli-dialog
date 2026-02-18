'use server';

import { getUser, userHasCompletedTraining } from '@/auth/utils';
import { checkProductAccess } from '@/utils/vidis/access';
import { sendChatMessage } from './chat-service';
import type { ChatMessage, SendMessageResult } from './chat-service';

export type { ChatMessage, SendMessageResult } from './chat-service';

export async function sendChatMessageAction({
  conversationId,
  messages,
  modelId,
  characterId,
  customGptId,
  fileIds,
}: {
  conversationId: string;
  messages: ChatMessage[];
  modelId: string;
  characterId?: string;
  customGptId?: string;
  fileIds?: string[];
}): Promise<SendMessageResult> {
    // TODO: Switch to requireAuth
    // Auth and access checks
    const [user, hasCompletedTraining] = await Promise.all([getUser(), userHasCompletedTraining()]);
    const productAccess = checkProductAccess({ ...user, hasCompletedTraining });

    if (!productAccess.hasAccess) {
    throw new Error(productAccess.errorType);
    }
  return sendChatMessage({
    conversationId,
    messages,
    modelId,
    characterId,
    customGptId,
    fileIds,
    user,
  });
}
