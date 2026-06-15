import {
  generateTextStreamWithBilling,
  TokenPointsExceededError,
  SharedChatExpiredError,
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
import { convertToAiCoreMessages, formatMessagesWithImages, limitChatHistory } from '../chat/utils';
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

  const chunks = await retrieveChunks({
    messages,
    federalStateId: teacherUserAndContext.federalState.id,
    relatedFileEntities,
    sourceUrls: processedUrls,
  });

  // Build system prompt
  const systemPrompt = constructCharacterSystemPrompt({
    character,
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
  (async () => {
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

  return {
    stream,
    messageId: assistantMessageId,
  };
}
