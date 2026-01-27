'use server';

import { generateTextStreamWithBilling, type Message as AiCoreMessage } from '@telli/ai-core';
import { createTextStream } from '@/utils/streaming';
import { getUserAndContextByUserId } from '@/auth/utils';
import { checkProductAccess } from '@/utils/vidis/access';
import {
  sharedChatHasExpired,
  sharedChatHasReachedTelliPointsLimit,
  userHasReachedTelliPointsLimit,
} from '../chat/usage';
import { getModelAndApiKeyWithResult } from '../utils/utils';
import {
  dbGetSharedChatByIdAndInviteCode,
  dbUpdateTokenUsageBySharedChatId,
} from '@shared/db/functions/shared-school-chat';
import { dbGetRelatedSharedChatFiles } from '@shared/db/functions/files';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { constructLearningScenarioSystemPrompt } from './system-prompt';
import { limitChatHistory } from '../chat/utils';
import { getRelevantFileContent } from '../file-operations/retrieval';
import { webScraperExecutable } from '../webpage-content/search-web-readability';
import { logError } from '@shared/logging';
import {
  KEEP_FIRST_MESSAGES,
  KEEP_RECENT_MESSAGES,
  TOTAL_CHAT_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type SendMessageResult = {
  stream: ReadableStream<string>;
  messageId: string;
};

/**
 * Converts frontend messages to ai-core message format
 */
function convertToAiCoreMessages(systemPrompt: string, messages: ChatMessage[]): AiCoreMessage[] {
  const result: AiCoreMessage[] = [{ role: 'system', content: systemPrompt }];

  for (const msg of messages) {
    if (msg.role === 'system') continue;
    result.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  return result;
}

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
  const sharedChat = await dbGetSharedChatByIdAndInviteCode({ id: sharedChatId, inviteCode });
  if (sharedChat === undefined) {
    throw new Error('Could not get shared chat');
  }

  // Get teacher user context
  const teacherUserAndContext = await getUserAndContextByUserId({ userId: sharedChat.userId });
  const productAccess = checkProductAccess(teacherUserAndContext);

  if (!productAccess.hasAccess) {
    throw new Error(productAccess.errorType);
  }

  if (teacherUserAndContext.school.userRole !== 'teacher') {
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
    throw new Error('Shared chat has reached end of life');
  }

  // Check limits
  const [sharedChatLimitReached, intelliPointsLimitReached] = await Promise.all([
    sharedChatHasReachedTelliPointsLimit({
      user: teacherUserAndContext,
      sharedChat,
    }),
    userHasReachedTelliPointsLimit({ user: teacherUserAndContext }),
  ]);

  if (sharedChatLimitReached) {
    throw new Error('Shared chat has reached intelli points limit');
  }

  if (intelliPointsLimitReached) {
    await sendRabbitmqEvent(
      constructTelliBudgetExceededEvent({
        anonymous: true,
        user: teacherUserAndContext,
        sharedChat,
      }),
    );
    throw new Error('User has reached intelli points limit');
  }

  // Get related files and web sources
  const relatedFileEntities = await dbGetRelatedSharedChatFiles(sharedChat.id);
  const urls = sharedChat.attachedLinks.filter((l) => l !== '');
  const websearchSources = await Promise.all(urls.map((url) => webScraperExecutable(url)));

  const retrievedTextChunks = await getRelevantFileContent({
    modelId: definedModel.id,
    apiKeyId,
    messages: messages.map<ChatMessage>((m) => ({ id: m.id, role: m.role, content: m.content })),
    user: teacherUserAndContext,
    relatedFileEntities,
  });

  // Build system prompt
  const systemPrompt = constructLearningScenarioSystemPrompt({
    sharedChat,
    retrievedTextChunks,
    websearchSources,
  });

  // Prune messages
  const prunedMessages = limitChatHistory({
    messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
    limitRecent: KEEP_RECENT_MESSAGES,
    limitFirst: KEEP_FIRST_MESSAGES,
    characterLimit: TOTAL_CHAT_LENGTH_LIMIT,
  });

  // Convert to ai-core format
  const aiCoreMessages = convertToAiCoreMessages(systemPrompt, prunedMessages as ChatMessage[]);

  // Create native stream
  const { stream, update, done, error: streamError } = createTextStream();
  const assistantMessageId = crypto.randomUUID();

  // Start streaming in the background
  (async () => {
    try {
      const textStream = generateTextStreamWithBilling(
        definedModel.id,
        aiCoreMessages,
        apiKeyId,
        async ({ usage, priceInCents }) => {
          const { promptTokens, completionTokens } = usage;

          await dbUpdateTokenUsageBySharedChatId({
            modelId: definedModel.id,
            completionTokens,
            promptTokens,
            sharedSchoolConversationId: sharedChat.id,
            userId: teacherUserAndContext.id,
            costsInCent: priceInCents,
          });

          await sendRabbitmqEvent(
            constructTelliNewMessageEvent({
              user: teacherUserAndContext,
              provider: definedModel.provider,
              promptTokens,
              completionTokens,
              costsInCent: priceInCents,
              anonymous: true,
              sharedChat,
            }),
          );
        },
      );

      for await (const chunk of textStream) {
        update(chunk);
      }

      done();
    } catch (error) {
      logError('Error during shared chat streaming:', error);
      streamError(error instanceof Error ? error : new Error('Unknown error'));
    }
  })();

  return {
    stream,
    messageId: assistantMessageId,
  };
}
