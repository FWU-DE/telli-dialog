'use server';

import { requireAuth } from '@/auth/requireAuth';
import { userHasCompletedTraining } from '@/auth/utils';
import { checkProductAccess } from '@/utils/vidis/access';
import { ChatMessage, SendMessageResult } from '@/types/chat';
import { sendLearningScenarioPreviewMessage } from './preview-chat-service';

export type { ChatMessage, SendMessageResult } from '@/types/chat';

export async function sendLearningScenarioPreviewMessageAction({
  previewSessionId,
  learningScenarioId,
  messages,
  modelId,
}: {
  previewSessionId: string;
  learningScenarioId: string;
  messages: ChatMessage[];
  modelId: string;
}): Promise<SendMessageResult> {
  const [{ user, federalState }, hasCompletedTraining] = await Promise.all([
    requireAuth(),
    userHasCompletedTraining(),
  ]);
  const userAndContext = {
    ...user,
    federalState,
  };
  const productAccess = checkProductAccess({ ...userAndContext, hasCompletedTraining });

  if (!productAccess.hasAccess) {
    throw new Error(productAccess.errorType);
  }

  return sendLearningScenarioPreviewMessage({
    previewSessionId,
    learningScenarioId,
    messages,
    modelId,
    user: userAndContext,
  });
}
