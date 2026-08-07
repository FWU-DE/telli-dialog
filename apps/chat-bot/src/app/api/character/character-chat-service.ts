import {
  generateTextStreamWithBilling,
  type ToolDefinition,
  TokenPointsExceededError,
  SharedChatExpiredError,
  runAgentLoop,
} from '@ais-chat/ai-core';
import { NotFoundError } from '@shared/error';
import { createTextStream, encodeChatStreamEvent } from '@/utils/streaming';
import { getUserAndContextByUserId } from '@/auth/utils';
import { checkProductAccess } from '@/utils/vidis/access';
import { getModelAndApiKeyWithResult } from '../utils/utils';
import { getChatModelSelection } from '../utils/model-circuit-breaker';
import {
  dbGetCharacterByIdAndInviteCode,
  dbUpdateTokenUsageByCharacterChatId,
} from '@shared/db/functions/character';
import { dbGetRelatedCharacterFiles } from '@shared/db/functions/files';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTokenBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { constructCharacterSystemPrompt } from './system-prompt';
import {
  convertToAiCoreMessages,
  determineImageAttachmentTypeForModel,
  enrichMessagesWithImageData,
  getMostRecentUserMessage,
  limitChatHistory,
} from '../chat/utils';
import { retrieveChunks } from '../rag/rag-service';
import { logError } from '@shared/logging';
import { buildTools } from '../chat/build-tools';
import { isWebSearchEnabledForEntity } from '../chat/websearch';
import { ChatMessage, SendMessageResult, createErrorResult } from '@/types/chat';
import { createImageAttachmentsForConversation } from '../file-operations/preprocess-image';
import { ingestWebContent } from '../rag/ingestWebContent';
import { RetrievedChunk } from '../rag/types';
import { resolveAgentNameForTracing } from '../utils/agent-name';
import { extractUrls } from '../utils/extract-urls';
import { combineSharedRelatedFiles } from '../shared-chat/shared-chat-file-service';
import {
  sharedCharacterChatHasReachedTokenPointsLimit,
  sharedChatHasExpired,
  userHasReachedTokenPointsLimit,
} from '@shared/users/usage';

/**
 * Sends a character chat message and streams the response.
 */
export async function sendCharacterMessage({
  characterId,
  inviteCode,
  messages,
  modelId,
  fileIds,
  sharedSessionId,
}: {
  characterId: string;
  inviteCode: string;
  messages: ChatMessage[];
  modelId: string;
  fileIds?: string[];
  sharedSessionId?: string;
}): Promise<SendMessageResult> {
  // Get character
  const character = await dbGetCharacterByIdAndInviteCode({ id: characterId, inviteCode });
  if (character === undefined || character.startedBy === null || character.suspended) {
    return createErrorResult(new NotFoundError('Character not found'));
  }

  // Get teacher user context
  const teacherUserAndContext = await getUserAndContextByUserId({ userId: character.startedBy });
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
  const modelSelection = await getChatModelSelection({
    model: definedModel,
    federalStateId: teacherUserAndContext.federalState.id,
  });
  const generationModelId = modelSelection.modelIds[0];
  const agenticChatEnabled =
    teacherUserAndContext.federalState.featureToggles.isAgenticChatEnabled ?? false;

  // Check expiry
  if (sharedChatHasExpired(character)) {
    return createErrorResult(new SharedChatExpiredError());
  }

  // Check limits
  const [sharedChatLimitReached, tokenPointsLimitReached] = await Promise.all([
    sharedCharacterChatHasReachedTokenPointsLimit({
      user: teacherUserAndContext,
      character,
    }),
    userHasReachedTokenPointsLimit({ user: teacherUserAndContext }),
  ]);

  if (tokenPointsLimitReached) {
    await sendRabbitmqEvent(
      constructTokenBudgetExceededEvent({
        anonymous: true,
        user: teacherUserAndContext,
        character,
      }),
    );
  }

  if (sharedChatLimitReached || tokenPointsLimitReached) {
    return createErrorResult(new TokenPointsExceededError());
  }

  // Get related files and web sources
  const relatedFileEntities = await combineSharedRelatedFiles({
    relatedFileEntities: await dbGetRelatedCharacterFiles(character.id),
    fileIds,
    inviteCode,
    entityType: 'character',
    entityId: characterId,
    sharedSessionId,
    userMessageId: getMostRecentUserMessage(messages)?.id,
  });
  const urls = extractUrls({
    character,
    messages,
  });
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

  const { stream, update, done, error: streamError } = createTextStream();
  const assistantMessageId = crypto.randomUUID();

  if (agenticChatEnabled) {
    const allowWebTools = isWebSearchEnabledForEntity({
      featureToggles: teacherUserAndContext.federalState.featureToggles,
      entity: character,
    });

    const tools = await buildTools({
      user: teacherUserAndContext,
      characterId: character.id,
      relatedFileEntities,
      attachedLinks: character.attachedLinks,
      sourceUrls: processedUrls,
      allowWebTools,
      allowMundoSearch: false,
      onWebSearchResults: (results) => {
        update(
          encodeChatStreamEvent({
            type: 'web_search_results',
            webSearchResults: results,
          }),
        );
      },
    });

    activeToolDefinitions = Object.values(tools.toolRegistry).map((entry) => entry.definition);

    toolRegistry = tools.toolRegistry;
  } else {
    chunks = await retrieveChunks({
      messages,
      federalStateId: teacherUserAndContext.federalState.id,
      relatedFileEntities,
      sourceUrls: processedUrls,
    });
  }

  // Build system prompt
  const systemPrompt = constructCharacterSystemPrompt({
    character,
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
  const aiCoreMessages = convertToAiCoreMessages(systemPrompt, messagesWithImages);

  if (agenticChatEnabled) {
    const agentName = resolveAgentNameForTracing({ characterId: character.id });

    runAgentLoop({
      modelSelection,
      apiKeyId,
      messages: aiCoreMessages,
      toolRegistry,
      agentName,
      onTextChunk: (delta) => {
        update(delta);
      },
      onComplete: async ({ usage, priceInCents, modelId, modelUsages }) => {
        const { promptTokens, completionTokens } = usage;

        // Agentic requests can invoke several models across iterations. Persist each usage
        // entry separately so pricing and reporting stay associated with the serving model. The
        // fallback is only needed until non-agentic streaming chat is removed.
        for (const modelUsage of modelUsages ?? [
          { modelId: modelId ?? generationModelId, usage, priceInCents },
        ]) {
          await dbUpdateTokenUsageByCharacterChatId({
            modelId: modelUsage.modelId ?? generationModelId,
            completionTokens: modelUsage.usage.completionTokens,
            promptTokens: modelUsage.usage.promptTokens,
            characterId: character.id,
            userId: teacherUserAndContext.id,
            costsInCent: modelUsage.priceInCents,
          });
        }

        await sendRabbitmqEvent(
          constructNewMessageEvent({
            user: teacherUserAndContext,
            promptTokens,
            completionTokens,
            costsInCent: priceInCents,
            provider: definedModel.provider,
            anonymous: true,
            character,
          }),
        );

        done();
      },
      onError: (error) => {
        logError('Error during character chat streaming:', error);
        streamError(error);
      },
    });
  } else {
    // Start streaming in the background
    void (async () => {
      try {
        const textStream = generateTextStreamWithBilling(
          modelSelection,
          aiCoreMessages,
          apiKeyId,
          async ({ usage, priceInCents, modelId }) => {
            const { promptTokens, completionTokens } = usage;

            await dbUpdateTokenUsageByCharacterChatId({
              modelId: modelId ?? generationModelId,
              completionTokens,
              promptTokens,
              characterId: character.id,
              userId: teacherUserAndContext.id,
              costsInCent: priceInCents,
            });

            await sendRabbitmqEvent(
              constructNewMessageEvent({
                user: teacherUserAndContext,
                promptTokens,
                completionTokens,
                costsInCent: priceInCents,
                provider: definedModel.provider,
                anonymous: true,
                character,
              }),
            );
          },
          undefined,
        );

        for await (const chunk of textStream) {
          update(chunk);
        }

        done();
      } catch (error) {
        logError('Error during character chat streaming:', error);
        streamError(error instanceof Error ? error : new Error('Unknown error'));
      }
    })();
  }

  return {
    stream,
    messageId: assistantMessageId,
  };
}
