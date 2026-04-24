'use server';

import { requireAuth } from '@/auth/requireAuth';
import { userHasCompletedTraining } from '@/auth/utils';

import { sendChatMessage } from './chat-service';
import { ChatMessage, SendMessageResult } from '@/types/chat';
import { checkProductAccess } from '@/utils/vidis/access';

export type { ChatMessage, SendMessageResult } from '@/types/chat';

export async function sendChatMessageAction({
  conversationId,
  messages,
  modelId,
  characterId,
  assistantId,
  fileIds,
}: {
  conversationId: string;
  messages: ChatMessage[];
  modelId: string;
  characterId?: string;
  assistantId?: string;
  fileIds?: string[];
}): Promise<SendMessageResult> {
  const [{ user, federalState }, hasCompletedTraining] = await Promise.all([
    requireAuth(),
    userHasCompletedTraining(),
  ]);
  const userAndContext = {
    ...user,
    federalState,
    hasApiKeyAssigned: federalState.hasApiKeyAssigned,
  };
  const productAccess = checkProductAccess({ ...userAndContext, hasCompletedTraining });

  if (!productAccess.hasAccess) {
    throw new Error(productAccess.errorType);
  }
  return sendChatMessage({
    conversationId,
    messages,
    modelId,
    characterId,
    assistantId,
    fileIds,
    user: userAndContext,
  });
}
