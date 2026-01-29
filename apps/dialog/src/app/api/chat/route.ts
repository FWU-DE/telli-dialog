import { type Message, smoothStream, streamText } from 'ai';
import {
  dbGetConversationAndMessages,
  dbGetOrCreateConversation,
  dbUpdateConversationTitle,
} from '@shared/db/functions/chat';
import { NextRequest, NextResponse } from 'next/server';
import { dbInsertChatContent } from '@shared/db/functions/chat';
import { getUser, updateSession, userHasCompletedTraining } from '@/auth/utils';
import { userHasReachedTelliPointsLimit } from './usage';
import {
  getModelAndProviderWithResult,
  calculateCostsInCent,
  getAuxiliaryModel,
  getTokenUsage,
} from '../utils/utils';
import { generateUUID } from '@shared/utils/uuid';
import { getChatTitle, getMostRecentUserMessage, limitChatHistory } from './utils';
import { constructChatSystemPrompt } from './system-prompt';
import { checkProductAccess } from '@/utils/vidis/access';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { dbUpdateLastUsedModelByUserId } from '@shared/db/functions/user';
import { dbGetAttachedFileByEntityId, linkFilesToConversation } from '@shared/db/functions/files';
import {
  KEEP_FIRST_MESSAGES,
  KEEP_RECENT_MESSAGES,
  MAX_WEBSEARCH_SOURCES_PER_CONVERSATION,
  TOTAL_CHAT_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { parseHyperlinks } from '@/utils/web-search/parsing';
import { getRelevantFileContent } from '../file-operations/retrieval';
import { extractImagesAndUrl } from '../file-operations/prepocess-image';
import { formatMessagesWithImages } from './utils';
import { logDebug, logError } from '@shared/logging';
import { dbGetCustomGptById } from '@shared/db/functions/custom-gpts';
import { dbGetCharacterByIdWithShareData } from '@shared/db/functions/character';
import { dbInsertConversationUsage } from '@shared/db/functions/token-usage';
import { webScraper } from '../webpage-content/search-web';
import { WebsearchSource } from '@shared/db/types';

export async function POST(request: NextRequest) {
  const [user, hasCompletedTraining] = await Promise.all([getUser(), userHasCompletedTraining()]);
  const productAccess = checkProductAccess({ ...user, hasCompletedTraining });

  if (!productAccess.hasAccess) {
    return NextResponse.json({ error: productAccess.errorType }, { status: 403 });
  }

  const {
    id,
    messages,
    modelId,
    characterId,
    customGptId,
    fileIds: currentFileIds,
  }: {
    id: string;
    messages: Message[];
    modelId: string;
    characterId?: string;
    customGptId: string;
    fileIds?: string[];
  } = await request.json();
  logDebug(
    `POST chat message with modelId ${modelId}, ${messages.length} messages and ${currentFileIds?.length ?? 0} files`,
  );

  const [error, modelAndProvider] = await getModelAndProviderWithResult({
    modelId,
    federalStateId: user.federalState.id,
  });

  const auxiliaryModel = await getAuxiliaryModel(user.federalState.id);

  const [errorAuxiliaryModel, auxiliaryModelAndProvider] = await getModelAndProviderWithResult({
    modelId: auxiliaryModel.id,
    federalStateId: user.federalState.id,
  });

  if (errorAuxiliaryModel !== null) {
    throw new Error(errorAuxiliaryModel.message);
  }

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { telliProvider, definedModel } = modelAndProvider;

  const conversation = await dbGetOrCreateConversation({
    conversationId: id,
    userId: user.id,
    characterId,
    customGptId,
  });

  if (conversation === undefined) {
    return NextResponse.json({ error: 'Could not get or create conversation' }, { status: 500 });
  }

  const conversationObject = await dbGetConversationAndMessages({
    conversationId: conversation.id,
    userId: user.id,
  });

  if (conversationObject === undefined) {
    return NextResponse.json({ error: 'Could not get conversation object' }, { status: 404 });
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (userMessage === undefined) {
    return NextResponse.json({ error: 'No user message found' }, { status: 400 });
  }

  const telliPointsLimitReached = await userHasReachedTelliPointsLimit({ user });

  if (telliPointsLimitReached) {
    await sendRabbitmqEvent(
      constructTelliBudgetExceededEvent({
        anonymous: false,
        user,
        conversation,
      }),
    );
    return NextResponse.json({ error: 'User has reached telli points limit.' }, { status: 429 });
  }

  // Collect websearch sources for the system prompt
  let websearchSources: WebsearchSource[] = []; // Final websearch sources to be used in system prompt
  let userMessageWebsearchSources: WebsearchSource[] = []; // Sources related to the current user message
  let urlsToScrape: string[] = []; // New urls to scrape
  let userMessageUrls: string[] = [];

  if (customGptId !== undefined) {
    const customGpt = await dbGetCustomGptById({ customGptId });
    urlsToScrape = customGpt?.attachedLinks.filter((l) => l !== '') ?? [];
  } else if (characterId !== undefined) {
    const character = await dbGetCharacterByIdWithShareData({ characterId, userId: user.id });
    urlsToScrape = character?.attachedLinks.filter((l) => l !== '') ?? [];
  } else {
    websearchSources = conversationObject.messages
      .filter((m) => m.role === 'user')
      .flatMap((m) => m.websearchSources);
    const remainingSlots = MAX_WEBSEARCH_SOURCES_PER_CONVERSATION - websearchSources.length;

    if (remainingSlots > 0) {
      // Collect URLs from current message
      userMessageUrls = [...new Set(parseHyperlinks(userMessage.content) ?? [])].filter(
        (l) => l !== '',
      );

      // Collect URLs from old messages without sources
      const oldMessageUrls = conversationObject.messages
        .filter((m) => m.role === 'user' && m.websearchSources.length === 0)
        .flatMap((m) => parseHyperlinks(m.content) ?? []);

      urlsToScrape = [...new Set([...userMessageUrls, ...oldMessageUrls])].slice(0, remainingSlots);
    }
  }

  // Scrape collected URLs
  const scrapedSources = await Promise.all(
    urlsToScrape.map(async (url) => {
      try {
        return await webScraper(url);
      } catch {
        return undefined;
      }
    }),
  ).then((results) => results.filter((x): x is WebsearchSource => !!x));

  // Build final websearchSources
  if (customGptId !== undefined || characterId !== undefined) {
    websearchSources = scrapedSources;
  } else {
    websearchSources = [...websearchSources, ...scrapedSources].slice(
      0,
      MAX_WEBSEARCH_SOURCES_PER_CONVERSATION,
    );

    userMessageWebsearchSources = scrapedSources.filter((s) => userMessageUrls.includes(s.link));
  }

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

  if (currentFileIds !== undefined) {
    await linkFilesToConversation({
      fileIds: currentFileIds,
      conversationMessageId: userMessage.id,
      conversationId: conversation.id,
    });
  }
  const relatedFileEntities = await dbGetAttachedFileByEntityId({
    conversationId: conversation.id,
    characterId,
    customGptId,
  });

  const orderedChunks = await getRelevantFileContent({
    messages,
    user,
    relatedFileEntities,
    model: auxiliaryModelAndProvider.telliProvider,
  });

  // attach the image url to each of the image files within relatedFileEntities
  const extractedImages = await extractImagesAndUrl(relatedFileEntities);

  // Check if the model supports images based on supportedImageFormats
  const modelSupportsImages =
    definedModel.supportedImageFormats !== null && definedModel.supportedImageFormats.length > 0;

  await updateSession({
    user: await dbUpdateLastUsedModelByUserId({ modelName: definedModel.name, userId: user.id }),
  });
  const prunedMessages = limitChatHistory({
    messages,
    limitRecent: KEEP_RECENT_MESSAGES,
    limitFirst: KEEP_FIRST_MESSAGES,
    characterLimit: TOTAL_CHAT_LENGTH_LIMIT,
  });
  const systemPrompt = await constructChatSystemPrompt({
    characterId,
    customGptId,
    isTeacher: user.school.userRole === 'teacher',
    federalState: user.federalState,
    websearchSources: websearchSources,
    retrievedTextChunks: orderedChunks,
  });

  // Format messages with images if the model supports vision
  const messagesWithImages = formatMessagesWithImages(
    prunedMessages,
    extractedImages,
    modelSupportsImages,
  );
  const result = streamText({
    model: telliProvider,
    system: systemPrompt,
    messages: messagesWithImages,
    experimental_generateMessageId: generateUUID,
    experimental_transform: smoothStream({ chunking: 'word', delayInMs: 20 }),
    async onFinish(assistantMessage) {
      await dbInsertChatContent({
        content: assistantMessage.text,
        role: 'assistant',
        userId: user.id,
        orderNumber: messages.length + 2,
        modelName: definedModel.name,
        conversationId: conversation.id,
      });

      if (messages.length === 1 || messages.length === 2 || conversation.name === null) {
        const chatTitle = await getChatTitle({
          model: auxiliaryModelAndProvider.telliProvider,
          message: userMessage,
        });
        await dbUpdateConversationTitle({
          name: chatTitle,
          conversationId: conversation.id,
          userId: user.id,
        });
      }

      const { promptTokens, completionTokens } = getTokenUsage(assistantMessage.usage);
      const costsInCent = calculateCostsInCent(definedModel, { promptTokens, completionTokens });

      await dbInsertConversationUsage({
        conversationId: conversation.id,
        userId: user.id,
        modelId: definedModel.id,
        completionTokens: completionTokens,
        promptTokens: promptTokens,
        costsInCent: costsInCent,
      });

      await sendRabbitmqEvent(
        constructTelliNewMessageEvent({
          user,
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          costsInCent: costsInCent,
          provider: definedModel.provider,
          anonymous: false,
          conversation,
        }),
      );
    },
    async onError(error) {
      logError('Error during streaming chat response:', error);

      await dbInsertChatContent({
        content: '',
        role: 'assistant',
        userId: user.id,
        orderNumber: conversationObject.messages.length + 2,
        modelName: definedModel.name,
        conversationId: conversation.id,
      });
    },
  });

  return result.toDataStreamResponse();
}
