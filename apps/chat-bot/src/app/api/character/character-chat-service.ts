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
  sharedCharacterChatHasReachedTokenPointsLimit,
  sharedChatHasExpired,
  userHasReachedTokenPointsLimit,
} from '../chat/usage';
import { getModelAndApiKeyWithResult } from '../utils/utils';
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
 * Sends a character chat message and streams the response.
 */
export async function sendCharacterMessage({
  characterId,
  inviteCode,
  messages,
  modelId,
}: {
  characterId: string;
  inviteCode: string;
  messages: ChatMessage[];
  modelId: string;
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
  const relatedFileEntities = await dbGetRelatedCharacterFiles(character.id);
  const urls = character.attachedLinks.filter((l) => l !== '');
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
      characterId: character.id,
      conversationId: `shared-character:${character.id}`,
      relatedFileEntities,
      attachedLinks: character.attachedLinks,
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

  // Create native stream
  const { stream, update, done, error: streamError } = createTextStream();
  const assistantMessageId = crypto.randomUUID();

  if (agenticChatEnabled) {
    runAgentLoop({
      modelId: definedModel.id,
      apiKeyId,
      messages: aiCoreMessages,
      toolRegistry,
      onTextChunk: (delta) => {
        update(delta);
      },
      onComplete: async ({ usage, priceInCents }) => {
        const { promptTokens, completionTokens } = usage;

        await dbUpdateTokenUsageByCharacterChatId({
          modelId: definedModel.id,
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
          definedModel.id,
          aiCoreMessages,
          apiKeyId,
          async ({ usage, priceInCents }) => {
            const { promptTokens, completionTokens } = usage;

            await dbUpdateTokenUsageByCharacterChatId({
              modelId: definedModel.id,
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
