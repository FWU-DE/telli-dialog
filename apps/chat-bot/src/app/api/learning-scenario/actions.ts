'use server';
import { requireValidInviteCode } from '@/auth/requireValidInviteCode';
import { sendLearningScenarioMessage } from './learning-scenario-chat-service';
import { ChatMessage, SendMessageResult, createErrorResult } from '@/types/chat';
import { SharedChatExpiredError } from '@ais-chat/ai-core/errors';

export type { ChatMessage, SendMessageResult } from '@/types/chat';

export async function sendLearningScenarioMessageAction({
  learningScenarioId,
  inviteCode,
  messages,
  modelId,
}: {
  learningScenarioId: string;
  inviteCode: string;
  messages: ChatMessage[];
  modelId: string;
}): Promise<SendMessageResult> {
  try {
    await requireValidInviteCode(inviteCode);
  } catch {
    return createErrorResult(new SharedChatExpiredError());
  }

  return sendLearningScenarioMessage({
    learningScenarioId,
    inviteCode,
    messages,
    modelId,
  });
}
