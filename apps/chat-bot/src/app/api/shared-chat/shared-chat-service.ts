import {
  generateTextStreamWithBilling,
  type Message as AiCoreMessage,
  TokenPointsExceededError,
  SharedChatExpiredError,
} from '@ais-chat/ai-core';
import { NotFoundError } from '@shared/error';
import { createTextStream } from '@/utils/streaming';
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
import { dbGetRelatedSharedChatFiles } from '@shared/db/functions/files';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTokenBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { constructLearningScenarioSystemPrompt } from './system-prompt';
import { formatMessagesWithImages, limitChatHistory } from '../chat/utils';
import { retrieveChunks } from '../rag/rag-service';
import { logError } from '@shared/logging';
import {
  KEEP_FIRST_MESSAGES,
  KEEP_RECENT_MESSAGES,
  TOTAL_CHAT_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { ChatMessage, SendMessageResult, createErrorResult } from '@/types/chat';
import { extractImagesAndUrl } from '../file-operations/preprocess-image';
import { ingestWebContent } from '../rag/ingestWebContent';

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
  const sharedChat = await dbGetLearningScenarioByIdAndInviteCode({
    learningScenarioId: sharedChatId,
    inviteCode,
  });
  if (sharedChat === undefined || sharedChat.suspended) {
    return createErrorResult(new NotFoundError('Shared chat not found'));
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

  // Get related files and web sources
  const relatedFileEntities = await dbGetRelatedSharedChatFiles(sharedChat.id);
  const urls = sharedChat.attachedLinks.filter((l) => l !== '');
  const { processedUrls } = await ingestWebContent({
    urls,
    federalStateId: teacherUserAndContext.federalState.id,
  });

  const chunks = await retrieveChunks({
    messages,
    federalStateId: teacherUserAndContext.federalState.id,
    relatedFileEntities,
    sourceUrls: processedUrls,
  });

  // Build system prompt
  const systemPrompt = constructLearningScenarioSystemPrompt({
    sharedChat,
    chunks,
  });

  // Prune messages
  const prunedMessages = limitChatHistory({
    messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
    limitRecent: KEEP_RECENT_MESSAGES,
    limitFirst: KEEP_FIRST_MESSAGES,
    characterLimit: TOTAL_CHAT_LENGTH_LIMIT,
  });

  // Check if the model supports images based on supportedImageFormats
  const modelSupportsImages =
    definedModel.supportedImageFormats !== null && definedModel.supportedImageFormats.length > 0;

  // attach the image url to each of the image files within relatedFileEntities
  const extractedImages = await extractImagesAndUrl(relatedFileEntities);

  // Format messages with images if the model supports vision
  const messagesWithImages = formatMessagesWithImages(
    prunedMessages,
    extractedImages,
    modelSupportsImages,
  );

  // Convert to ai-core format
  const aiCoreMessages = convertToAiCoreMessages(systemPrompt, messagesWithImages);

  // Create native stream
  const { stream, update, done, error: streamError } = createTextStream();
  const assistantMessageId = crypto.randomUUID();

  // Start streaming in the background
  void (async () => {
    try {
      const textStream = generateTextStreamWithBilling(
        definedModel.id,
        aiCoreMessages,
        apiKeyId,
        async ({ usage, priceInCents }) => {
          const { promptTokens, completionTokens } = usage;

          await dbUpdateTokenUsageBySharedLearningScenarioId({
            modelId: definedModel.id,
            completionTokens,
            promptTokens,
            learningScenarioId: sharedChat.id,
            userId: teacherUserAndContext.id,
            costsInCent: priceInCents,
          });

          await sendRabbitmqEvent(
            constructNewMessageEvent({
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
