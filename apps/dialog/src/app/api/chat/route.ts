import { type Message, smoothStream, streamText } from 'ai';
import {
  dbGetConversationAndMessages,
  dbGetOrCreateConversation,
  dbUpdateConversationTitle,
} from '@/db/functions/chat';
import { NextRequest, NextResponse } from 'next/server';
import { dbInsertChatContent } from '@/db/functions/chat';
import { getUser } from '@/auth/utils';
import { userHasReachedIntelliPointLimit, trackChatUsage } from './usage';
import { getModelAndProviderWithResult, calculateCostsInCents, getAuxiliaryModel } from '../utils';
import { generateUUID } from '@/utils/uuid';
import { getChatTitle, getMostRecentUserMessage, limitChatHistory } from './utils';
import { constructChatSystemPrompt } from './system-prompt';
import { checkProductAccess } from '@/utils/vidis/access';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { dbUpdateLastUsedModelByUserId } from '@/db/functions/user';
import { dbGetAttachedFileByEntityId, link_file_to_conversation } from '@/db/functions/files';
import { TOTAL_CHAT_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { SMALL_MODEL_MAX_CHARACTERS } from '@/configuration-text-inputs/const';
import { SMALL_MODEL_LIST } from '@/configuration-text-inputs/const';
import { parseHyperlinks } from '@/utils/web-search/parsing';
import { webScraperExecutable } from '../conversation/tools/websearch/search-web';
import { WebsearchSource } from '../conversation/tools/websearch/types';
import { getRelevantFileContent } from '../file-operations/retrieval';
import { extractImagesAndUrl } from '../file-operations/prepocess-image';
import { formatMessagesWithImages } from './utils';
import { logDebug } from '@/utils/logging/logging';

export async function POST(request: NextRequest) {
  const user = await getUser();

  const productAccess = checkProductAccess(user);

  if (!productAccess.hasAccess) {
    return NextResponse.json({ error: productAccess.errorType }, { status: 403 });
  }

  if (await userHasReachedIntelliPointLimit({ user })) {
    return NextResponse.json({ error: 'User has reached intelli points limit' }, { status: 429 });
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

  const auxiliaryModel = await getAuxiliaryModel(user);

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

  const intelliPointsLimitReached = await userHasReachedIntelliPointLimit({ user });

  if (intelliPointsLimitReached) {
    await sendRabbitmqEvent(
      constructTelliBudgetExceededEvent({
        anonymous: false,
        user,
        conversation,
      }),
    );
    return NextResponse.json({ error: 'User has reached intelli points limit' }, { status: 429 });
  }

  await dbInsertChatContent({
    conversationId: conversation.id,
    id: userMessage.id,
    content: userMessage.content,
    role: 'user',
    userId: user.id,
    modelName: definedModel.name,
    orderNumber: messages.length + 1,
  });

  if (currentFileIds !== undefined) {
    await link_file_to_conversation({
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

  const urls = [userMessage, ...messages]
    .map((message) => parseHyperlinks(message.content) ?? [])
    .flat();

  let websearchSources: WebsearchSource[] = [];
  try {
    websearchSources = await Promise.all(
      urls.map(async (url) => {
        return await webScraperExecutable(url);
      }),
    );
  } catch (error) {
    console.error('Unhandled error while fetching website', error);
  }
  // Condense chat history to search query to use for vector search and text retrieval

  await dbUpdateLastUsedModelByUserId({ modelName: definedModel.name, userId: user.id });
  const maxCharacterLimit = SMALL_MODEL_LIST.includes(definedModel.displayName)
    ? SMALL_MODEL_MAX_CHARACTERS
    : TOTAL_CHAT_LENGTH_LIMIT;
  const prunedMessages = limitChatHistory({
    messages,
    limitRecent: 10,
    limitFirst: 2,
    characterLimit: maxCharacterLimit,
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
        let chatTitle = 'Neue Konversation';
        try {
          chatTitle = await getChatTitle({
            model: auxiliaryModelAndProvider.telliProvider,
            messages,
          });
        } catch (error) {
          console.error('Unhandled error while generating conversation title', error);
        }
        await dbUpdateConversationTitle({
          name: chatTitle,
          conversationId: conversation.id,
          userId: user.id,
        });
      }

      await trackChatUsage({
        userId: user.id,
        conversationId: conversation.id,
        model: definedModel,
        usage: assistantMessage.usage,
      });

      await sendRabbitmqEvent(
        constructTelliNewMessageEvent({
          user,
          promptTokens: assistantMessage.usage.promptTokens,
          completionTokens: assistantMessage.usage.completionTokens,
          costsInCents: calculateCostsInCents(definedModel, assistantMessage.usage),
          provider: definedModel.provider,
          anonymous: false,
          conversation,
        }),
      );
    },
    async onError(error) {
      console.error({ error });

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
