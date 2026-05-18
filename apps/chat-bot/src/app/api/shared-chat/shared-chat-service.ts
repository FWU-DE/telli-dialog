import { TokenPointsExceededError, SharedChatExpiredError } from '@ais-chat/ai-core';
import { getUserAndContextByUserId } from '@/auth/utils';
import { checkProductAccess } from '@/utils/vidis/access';
import {
  sharedChatHasExpired,
  sharedChatHasReachedTokenPointsLimit,
  userHasReachedTokenPointsLimit,
} from '../chat/usage';
import { getModelAndApiKeyWithResult } from '../utils/utils';
import {
  dbGetLearningScenarioByIdAndInviteCode,
  dbUpdateTokenUsageBySharedLearningScenarioId,
} from '@shared/db/functions/learning-scenario';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTokenBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { ChatMessage, SendMessageResult, createErrorResult } from '@/types/chat';
import { streamLearningScenarioReply } from './learning-scenario-stream';

/**
 * Server Action to send a shared chat (learning scenario) message and stream the response.
 */
export async function sendSharedChatMessage({
  sharedChatId,
  inviteCode,
  messages,
  modelId,
}: {
  sharedChatId: string;
  inviteCode: string;
  messages: ChatMessage[];
  modelId: string;
}): Promise<SendMessageResult> {
  // Get shared chat
  const sharedChat = await dbGetLearningScenarioByIdAndInviteCode({
    learningScenarioId: sharedChatId,
    inviteCode,
  });
  if (sharedChat === undefined) {
    throw new Error('Could not get shared chat');
  }

  // Get teacher user context
  const teacherUserAndContext = await getUserAndContextByUserId({ userId: sharedChat.startedBy });
  const productAccess = checkProductAccess(teacherUserAndContext);

  if (!productAccess.hasAccess) {
    throw new Error(productAccess.errorType);
  }

  if (teacherUserAndContext.userRole !== 'teacher') {
    throw new Error('The user assigned to this chat is not a teacher');
  }

  // Get model and API key
  const [error, modelAndApiKey] = await getModelAndApiKeyWithResult({
    modelId,
    federalStateId: teacherUserAndContext.federalState.id,
  });

  if (error !== null) {
    throw new Error(error.message);
  }

  const { model: definedModel, apiKeyId } = modelAndApiKey;

  // Check expiry
  if (sharedChatHasExpired(sharedChat)) {
    return createErrorResult(new SharedChatExpiredError());
  }

  // Check limits
  const [sharedChatLimitReached, tokenPointsLimitReached] = await Promise.all([
    sharedChatHasReachedTokenPointsLimit({
      user: teacherUserAndContext,
      sharedChat,
    }),
    userHasReachedTokenPointsLimit({ user: teacherUserAndContext }),
  ]);

  if (tokenPointsLimitReached) {
    await sendRabbitmqEvent(
      constructTokenBudgetExceededEvent({
        anonymous: true,
        user: teacherUserAndContext,
        sharedChat,
      }),
    );
  }

  if (sharedChatLimitReached || tokenPointsLimitReached) {
    return createErrorResult(new TokenPointsExceededError());
  }

  return streamLearningScenarioReply({
    learningScenario: sharedChat,
    user: teacherUserAndContext,
    messages,
    model: definedModel,
    apiKeyId,
    eventAnonymous: true,
    logTag: 'shared chat',
    onUsage: async ({ promptTokens, completionTokens, costsInCent }) => {
      await dbUpdateTokenUsageBySharedLearningScenarioId({
        modelId: definedModel.id,
        completionTokens,
        promptTokens,
        learningScenarioId: sharedChat.id,
        userId: teacherUserAndContext.id,
        costsInCent,
      });
    },
  });
}
