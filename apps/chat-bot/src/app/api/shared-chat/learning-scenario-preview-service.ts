import { TokenPointsExceededError } from '@ais-chat/ai-core';
import { userHasReachedTokenPointsLimit } from '../chat/usage';
import { getModelAndApiKeyWithResult } from '../utils/utils';
import { getLearningScenarioForChatSession } from '@shared/learning-scenarios/learning-scenario-service';
import { dbInsertConversationUsage } from '@shared/db/functions/token-usage';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTokenBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { ChatMessage, SendMessageResult, createErrorResult } from '@/types/chat';
import { UserAndContext } from '@/auth/types';
import { checkParameterUUID } from '@shared/error';
import { streamLearningScenarioReply } from './learning-scenario-stream';

/**
 * Teacher-side preview chat for a learning scenario. Mirrors the system prompt
 * and rendering of the student-facing shared chat, but uses authenticated
 * teacher access instead of an invite code and does not persist messages.
 *
 * Usage is still tracked against the teacher's own monthly budget so the
 * preview can't be abused to bypass token limits. There is no per-share
 * token/time limit because no share is involved.
 */
export async function sendLearningScenarioPreviewMessage({
  previewSessionId,
  learningScenarioId,
  messages,
  modelId,
  user,
}: {
  previewSessionId: string;
  learningScenarioId: string;
  messages: ChatMessage[];
  modelId: string;
  user: UserAndContext;
}): Promise<SendMessageResult> {
  // Validate the client-supplied session id so we can't pollute usage tracking
  // rows with arbitrary strings. The id is only used to attribute tokens — userId
  // remains the authoritative anti-IDOR check, this is defense in depth.
  checkParameterUUID(previewSessionId);

  const learningScenario = await getLearningScenarioForChatSession({
    learningScenarioId,
    user,
  });

  const [error, modelAndApiKey] = await getModelAndApiKeyWithResult({
    modelId,
    federalStateId: user.federalState.id,
  });

  if (error !== null) {
    throw new Error(error.message);
  }

  const { model: definedModel, apiKeyId } = modelAndApiKey;

  if (await userHasReachedTokenPointsLimit({ user })) {
    await sendRabbitmqEvent(
      constructTokenBudgetExceededEvent({
        anonymous: false,
        user,
        sharedChat: learningScenario,
      }),
    );
    return createErrorResult(new TokenPointsExceededError());
  }

  return streamLearningScenarioReply({
    learningScenario,
    user,
    messages,
    model: definedModel,
    apiKeyId,
    eventAnonymous: false,
    logTag: 'learning scenario preview',
    onUsage: async ({ promptTokens, completionTokens, costsInCent }) => {
      // Track usage on the teacher's monthly budget. We reuse the
      // conversation_usage_tracking table — the conversationId column has
      // no FK constraint, so the previewSessionId is enough to attribute
      // tokens without persisting a conversation row.
      await dbInsertConversationUsage({
        conversationId: previewSessionId,
        userId: user.id,
        modelId: definedModel.id,
        completionTokens,
        promptTokens,
        costsInCent,
      });
    },
  });
}
