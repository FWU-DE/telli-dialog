'use server';

import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { userHasCompletedTraining } from '@/auth/utils';
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
  const [{ user, school, federalState }, hasCompletedTraining] = await Promise.all([
    requireAuth(),
    userHasCompletedTraining(),
  ]);
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);
  const productAccess = checkProductAccess({ ...userAndContext, hasCompletedTraining });

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
    user: userAndContext,
  });
}
