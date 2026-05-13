'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import { ForbiddenError } from '@shared/error/forbidden-error';
import { chatWithImageAssistant, type AssistantMessage } from './image-assistant-service';

export async function imageAssistantAction(messages: AssistantMessage[], initialPrompt?: string) {
  const { user, federalState } = await requireAuth();
  if (!(federalState.featureToggles.isImageAssistantEnabled ?? false)) {
    throw new ForbiddenError('Image assistant is not enabled for this federal state');
  }
  return runServerAction(chatWithImageAssistant)({
    messages,
    initialPrompt,
    federalStateId: federalState.id,
  });
}
