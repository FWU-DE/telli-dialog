'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import { chatWithImageAssistant, type AssistantMessage } from './image-assistant-service';

export async function imageAssistantAction(messages: AssistantMessage[], initialPrompt?: string) {
  const { user, federalState } = await requireAuth();
  return runServerAction(chatWithImageAssistant)({
    messages,
    initialPrompt,
    userId: user.id,
    federalStateId: federalState.id,
  });
}
