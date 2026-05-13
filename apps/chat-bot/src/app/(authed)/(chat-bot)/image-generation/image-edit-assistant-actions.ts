'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import { chatWithImageEditAssistant, type AssistantMessage } from './image-edit-assistant-service';

export async function imageEditAssistantAction(
  messages: AssistantMessage[],
  context: { originalPrompt: string; imageUrl?: string },
) {
  const { user, federalState } = await requireAuth();
  return runServerAction(chatWithImageEditAssistant)({
    messages,
    originalPrompt: context.originalPrompt,
    imageUrl: context.imageUrl,
    userId: user.id,
    federalStateId: federalState.id,
  });
}
