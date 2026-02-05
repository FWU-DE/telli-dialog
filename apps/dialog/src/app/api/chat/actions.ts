'use server';

import { generateTextStreamWithBilling, type Message as AiCoreMessage } from '@telli/ai-core';
import { createTextStream } from '@/utils/streaming';
import { getUser, userHasCompletedTraining } from '@/auth/utils';
import { checkProductAccess } from '@/utils/vidis/access';
import { userHasReachedTelliPointsLimit } from './usage';
import { getModelAndApiKeyWithResult, getAuxiliaryModel } from '../utils/utils';
import {
  dbGetConversationAndMessages,
  dbGetOrCreateConversation,
  dbUpdateConversationTitle,
  dbInsertChatContent,
} from '@shared/db/functions/chat';
import { dbInsertConversationUsage } from '@shared/db/functions/token-usage';
import { dbUpdateLastUsedModelByUserId } from '@shared/db/functions/user';
import { dbGetAttachedFileByEntityId, linkFilesToConversation } from '@shared/db/functions/files';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { constructChatSystemPrompt } from './system-prompt';
import { formatMessagesWithImages, getChatTitle, limitChatHistory } from './utils';
import { getRelevantFileContent } from '../file-operations/retrieval';
import { parseHyperlinks } from '@/utils/web-search/parsing';
import { webScraper } from '../webpage-content/search-web';
import { WebsearchSource } from '@shared/db/types';
import { dbGetCustomGptById } from '@shared/db/functions/custom-gpts';
import { dbGetCharacterByIdWithShareData } from '@shared/db/functions/character';
import { logError } from '@shared/logging';
import {
  KEEP_FIRST_MESSAGES,
  KEEP_RECENT_MESSAGES,
  TOTAL_CHAT_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { extractImagesAndUrl } from '../file-operations/prepocess-image';
import { ChatAttachment } from '@/types/chat';
import { searchWeb } from './websearch-service';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  experimental_attachments?: ChatAttachment[];
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
    if (msg.role === 'system') continue; // Skip system messages, we add our own
    result.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
      attachments: msg.experimental_attachments,
    });
  }

  return result;
}

/**
 * Server Action to send a chat message and stream the response.
 * Returns a streamable value that the client can consume.
 */
export async function sendChatMessage({
  conversationId,
  messages,
  modelId,
  characterId,
  customGptId,
  fileIds,
}: {
  conversationId: string;
  messages: ChatMessage[];
  modelId: string;
  characterId?: string;
  customGptId?: string;
  fileIds?: string[];
}): Promise<SendMessageResult> {
  // Auth and access checks
  const [user, hasCompletedTraining] = await Promise.all([getUser(), userHasCompletedTraining()]);
  const productAccess = checkProductAccess({ ...user, hasCompletedTraining });

  if (!productAccess.hasAccess) {
    throw new Error(productAccess.errorType);
  }

  // Get model and API key
  const [error, modelAndApiKey] = await getModelAndApiKeyWithResult({
    modelId,
    federalStateId: user.federalState.id,
  });

  if (error !== null) {
    throw new Error(error.message);
  }

  const { model: definedModel, apiKeyId } = modelAndApiKey;

  // Get auxiliary model for title generation
  const auxiliaryModel = await getAuxiliaryModel(user.federalState.id);
  const [errorAux, auxiliaryModelAndApiKey] = await getModelAndApiKeyWithResult({
    modelId: auxiliaryModel.id,
    federalStateId: user.federalState.id,
  });

  if (errorAux !== null) {
    throw new Error(errorAux.message);
  }

  // Get or create conversation
  const conversation = await dbGetOrCreateConversation({
    conversationId,
    userId: user.id,
    characterId,
    customGptId,
  });

  if (conversation === undefined) {
    throw new Error('Could not get or create conversation');
  }

  const conversationObject = await dbGetConversationAndMessages({
    conversationId: conversation.id,
    userId: user.id,
  });

  if (conversationObject === undefined) {
    throw new Error('Could not get conversation object');
  }

  // Check budget limit after we have the conversation for proper event tracking
  if (await userHasReachedTelliPointsLimit({ user })) {
    await sendRabbitmqEvent(
      constructTelliBudgetExceededEvent({
        anonymous: false,
        user,
        conversation,
      }),
    );
    throw new Error('User has reached telli points limit');
  }

  // Get the user message (last message should be from user)
  const userMessage = messages[messages.length - 1];
  if (!userMessage || userMessage.role !== 'user') {
    throw new Error('No user message found');
  } 
  const { websearchSources, userMessageWebsearchSources } = await searchWeb(
    customGptId,
    characterId,
    user,
    userMessage,
    conversationObject.messages,
  );

  // Save user message to DB
  await dbInsertChatContent({
    conversationId: conversation.id,
    id: userMessage.id,
    content: userMessage.content,
    role: 'user',
    userId: user.id,
    modelName: definedModel.name,
    orderNumber: messages.length + 1,
    websearchSources: userMessageWebsearchSources,
  });

  // Link files to conversation
  if (fileIds && fileIds.length > 0) {
    await linkFilesToConversation({
      fileIds,
      conversationMessageId: userMessage.id,
      conversationId: conversation.id,
    });
  }

  // Get related files and content
  const relatedFileEntities = await dbGetAttachedFileByEntityId({
    conversationId: conversation.id,
    characterId,
    customGptId,
  });

  const orderedChunks = await getRelevantFileContent({
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })) as ChatMessage[],
    user,
    relatedFileEntities,
    modelId: auxiliaryModel.id,
    apiKeyId: auxiliaryModelAndApiKey.apiKeyId,
  });

  // Get URLs for web search
  let urls: string[] = [];
  if (customGptId) {
    const customGpt = await dbGetCustomGptById({ customGptId });
    if (customGpt) {
      urls = customGpt.attachedLinks;
    }
  } else if (characterId) {
    const character = await dbGetCharacterByIdWithShareData({
      characterId,
      userId: user.id,
    });
    if (character) {
      urls = character.attachedLinks;
    }
  } else {
    urls = messages.flatMap((message) => parseHyperlinks(message.content) ?? []);
  }

  // Update last used model
  await dbUpdateLastUsedModelByUserId({ modelName: definedModel.name, userId: user.id });

  // Prune messages
  const prunedMessages = limitChatHistory({
    messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
    limitRecent: KEEP_RECENT_MESSAGES,
    limitFirst: KEEP_FIRST_MESSAGES,
    characterLimit: TOTAL_CHAT_LENGTH_LIMIT,
  });

  // Build system prompt
  const systemPrompt = await constructChatSystemPrompt({
    characterId,
    customGptId,
    isTeacher: user.school.userRole === 'teacher',
    federalState: user.federalState,
    websearchSources,
    retrievedTextChunks: orderedChunks,
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
    let fullText = '';

    try {
      const textStream = generateTextStreamWithBilling(
        definedModel.id,
        aiCoreMessages,
        apiKeyId,
        async ({ usage, priceInCents }) => {
          // Save assistant message to DB
          await dbInsertChatContent({
            content: fullText,
            role: 'assistant',
            userId: user.id,
            orderNumber: messages.length + 2,
            modelName: definedModel.name,
            conversationId: conversation.id,
          });

          // Generate title if needed
          if (messages.length <= 2 || conversation.name === null) {
            const chatTitle = await getChatTitle({
              modelId: auxiliaryModel.id,
              apiKeyId: auxiliaryModelAndApiKey.apiKeyId,
              message: userMessage,
            });
            await dbUpdateConversationTitle({
              name: chatTitle,
              conversationId: conversation.id,
              userId: user.id,
            });
          }

          const { promptTokens, completionTokens } = usage;

          // Save usage
          await dbInsertConversationUsage({
            conversationId: conversation.id,
            userId: user.id,
            modelId: definedModel.id,
            completionTokens,
            promptTokens,
            costsInCent: priceInCents,
          });

          // Send event
          await sendRabbitmqEvent(
            constructTelliNewMessageEvent({
              user,
              promptTokens,
              completionTokens,
              costsInCent: priceInCents,
              provider: definedModel.provider,
              anonymous: false,
              conversation,
            }),
          );
        },
      );

      for await (const chunk of textStream) {
        fullText += chunk;
        update(chunk);
      }

      done();
    } catch (error) {
      logError('Error during chat streaming:', error);

      // Save empty assistant message on error
      await dbInsertChatContent({
        content: '',
        role: 'assistant',
        userId: user.id,
        orderNumber: conversationObject.messages.length + 1,
        modelName: definedModel.name,
        conversationId: conversation.id,
      });

      streamError(error instanceof Error ? error : new Error('Unknown error'));
    }
  })();

  return {
    stream,
    messageId: assistantMessageId,
  };
}
