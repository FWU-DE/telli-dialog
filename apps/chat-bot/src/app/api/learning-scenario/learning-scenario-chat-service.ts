import {
  generateTextStreamWithBilling,
  type ToolDefinition,
  TokenPointsExceededError,
  SharedChatExpiredError,
  runAgentLoop,
} from '@ais-chat/ai-core';
import { NotFoundError } from '@shared/error';
import { createTextStream } from '@/utils/streaming';
import { getUserAndContextByUserId } from '@/auth/utils';
import { checkProductAccess } from '@/utils/vidis/access';
import {
  sharedChatHasExpired,
  sharedLearningScenarioChatHasReachedTokenPointsLimit,
  userHasReachedTokenPointsLimit,
} from '../chat/usage';
import { getModelAndApiKeyWithResult } from '../utils/utils';
import {
  dbGetLearningScenarioByIdAndInviteCode,
  dbUpdateTokenUsageBySharedLearningScenarioId,
} from '@shared/db/functions/learning-scenario';
import { dbGetRelatedLearningScenarioFiles } from '@shared/db/functions/files';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTokenBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { constructLearningScenarioSystemPrompt } from './system-prompt';
import {
  convertToAiCoreMessages,
  determineImageAttachmentTypeForModel,
  enrichMessagesWithImageData,
  limitChatHistory,
} from '../chat/utils';
import { retrieveChunks } from '../rag/rag-service';
import { logError } from '@shared/logging';
import { buildTools } from '../chat/build-tools';
import { ChatMessage, SendMessageResult, createErrorResult } from '@/types/chat';
import { createImageAttachmentsForConversation } from '../file-operations/preprocess-image';
import { ingestWebContent } from '../rag/ingestWebContent';
import { RetrievedChunk } from '../rag/types';

/**
 * Server Action to send a learning scenario message and stream the response.
 */
export async function sendLearningScenarioMessage({
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
  // Get learning scenario
  const learningScenario = await dbGetLearningScenarioByIdAndInviteCode({
    learningScenarioId,
    inviteCode,
  });
  if (learningScenario === undefined || learningScenario.suspended) {
    return createErrorResult(new NotFoundError('Learning scenario not found'));
  }

  // Get teacher user context
  const teacherUserAndContext = await getUserAndContextByUserId({
    userId: learningScenario.startedBy,
  });
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
  const agenticChatEnabled =
    teacherUserAndContext.federalState.featureToggles.isAgenticChatEnabled ?? false;

  // Check expiry
  if (sharedChatHasExpired(learningScenario)) {
    return createErrorResult(new SharedChatExpiredError());
  }

  // Check limits
  const [sharedChatLimitReached, tokenPointsLimitReached] = await Promise.all([
    sharedLearningScenarioChatHasReachedTokenPointsLimit({
      user: teacherUserAndContext,
      learningScenario: learningScenario,
    }),
    userHasReachedTokenPointsLimit({ user: teacherUserAndContext }),
  ]);

  if (tokenPointsLimitReached) {
    await sendRabbitmqEvent(
      constructTokenBudgetExceededEvent({
        anonymous: true,
        user: teacherUserAndContext,
        sharedChat: learningScenario,
      }),
    );
  }

  if (sharedChatLimitReached || tokenPointsLimitReached) {
    return createErrorResult(new TokenPointsExceededError());
  }

  // Get related files and web sources
  const relatedFileEntities = await dbGetRelatedLearningScenarioFiles(learningScenario.id);
  const urls = learningScenario.attachedLinks.filter((l) => l !== '');
  const { processedUrls } = await ingestWebContent({
    urls,
    federalStateId: teacherUserAndContext.federalState.id,
  });

  let activeToolDefinitions: ToolDefinition[] = [];
  let chunks: RetrievedChunk[] = [];
  let toolRegistry:
    | Record<
        string,
        { definition: ToolDefinition; handler: (args: Record<string, unknown>) => Promise<string> }
      >
    | undefined;

  if (agenticChatEnabled) {
    const builtTools = await buildTools({
      user: teacherUserAndContext,
      learningScenarioId: learningScenario.id,
      conversationId: `shared-learning-scenario:${learningScenario.id}`,
      relatedFileEntities,
      attachedLinks: learningScenario.attachedLinks,
      sourceUrls: processedUrls,
    });

    activeToolDefinitions = Object.values(builtTools.toolRegistry).map((entry) => entry.definition);

    toolRegistry = builtTools.toolRegistry;
  } else {
    chunks = await retrieveChunks({
      messages,
      federalStateId: teacherUserAndContext.federalState.id,
      relatedFileEntities,
      sourceUrls: processedUrls,
    });
  }

  // Build system prompt
  const systemPrompt = constructLearningScenarioSystemPrompt({
    learningScenario: learningScenario,
    chunks,
    activeToolDefinitions,
  });

  // Prune messages
  const prunedMessages = limitChatHistory(messages);

  // Check if the model supports images based on supportedImageFormats
  const modelSupportsImages =
    definedModel.supportedImageFormats !== null && definedModel.supportedImageFormats.length > 0;

  const imageAttachmentType = determineImageAttachmentTypeForModel(definedModel);

  // attach the image url to each of the image files within relatedFileEntities
  const extractedImages = await createImageAttachmentsForConversation(
    relatedFileEntities,
    imageAttachmentType,
  );

  // Format messages with images if the model supports vision
  const messagesWithImages = enrichMessagesWithImageData(
    prunedMessages,
    extractedImages,
    modelSupportsImages,
    imageAttachmentType,
  );

  // Convert to ai-core format
  // Create native stream
  const { stream, update, done, error: streamError } = createTextStream();
  const assistantMessageId = crypto.randomUUID();

  if (agenticChatEnabled) {
    runAgentLoop({
      modelId: definedModel.id,
      apiKeyId,
      messages: convertToAiCoreMessages(systemPrompt, messagesWithImages),
      toolRegistry,
      onTextChunk: (delta) => {
        update(delta);
      },
      onComplete: async ({ usage, priceInCents }) => {
        const { promptTokens, completionTokens } = usage;

        await dbUpdateTokenUsageBySharedLearningScenarioId({
          modelId: definedModel.id,
          completionTokens,
          promptTokens,
          learningScenarioId: learningScenario.id,
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
            sharedChat: learningScenario,
          }),
        );

        done();
      },
      onError: (error) => {
        logError('Error during shared chat streaming:', error);
        streamError(error);
      },
    });
  } else {
    // Start streaming in the background
    void (async () => {
      try {
        const textStream = generateTextStreamWithBilling(
          definedModel.id,
          convertToAiCoreMessages(systemPrompt, messagesWithImages),
          apiKeyId,
          async ({ usage, priceInCents }) => {
            const { promptTokens, completionTokens } = usage;

            await dbUpdateTokenUsageBySharedLearningScenarioId({
              modelId: definedModel.id,
              completionTokens,
              promptTokens,
              learningScenarioId: learningScenario.id,
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
                sharedChat: learningScenario,
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
  }

  return {
    stream,
    messageId: assistantMessageId,
  };
}
