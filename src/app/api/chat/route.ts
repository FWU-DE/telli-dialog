import { generateText, type Message, smoothStream, streamText } from 'ai';
import {
  dbGetConversationAndMessages,
  dbGetOrCreateConversation,
  dbUpdateConversationTitle,
} from '@/db/functions/chat';
import { NextRequest, NextResponse } from 'next/server';
import { dbInsertChatContent } from '@/db/functions/chat';
import { getUser } from '@/auth/utils';
import { userHasReachedIntelliPointLimit, trackChatUsage } from './usage';
import { getModelAndProviderWithResult, calculateCostsInCents } from '../utils';
import { generateUUID } from '@/utils/uuid';
import { getMostRecentUserMessage, limitChatHistory } from './utils';
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
import { SUPPORTED_IMAGE_EXTENSIONS } from '@/const';
import { readFileFromS3 } from '@/s3';
import { isImageFile } from '@/utils/files/image-utils';

/**
 * Extract images from attached files and convert them to base64
 */
async function extractImagesAsBase64(relatedFileEntities: any[]): Promise<Array<{
  type: 'image';
  image: string;
  mimeType?: string;
}>> {
  const imageFiles = relatedFileEntities.filter(file => isImageFile(file.name));
  
  if (imageFiles.length === 0) {
    return [];
  }

  const imagePromises = imageFiles.map(async (file) => {
    try {
      const buffer = await readFileFromS3({ key: `message_attachments/${file.id}` });
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`;
      
      return {
        type: 'image' as const,
        image: dataUrl,
        mimeType: file.type || 'image/jpeg',
      };
    } catch (error) {
      console.error(`Failed to process image file ${file.id}:`, error);
      return null;
    }
  });

  const images = await Promise.all(imagePromises);
  return images.filter((img) => img !== null) as Array<{
    type: 'image';
    image: string;
    mimeType: string;
  }>;
}

/**
 * Format messages to include images for models that support vision
 */
function formatMessagesWithImages(messages: Message[], images: Array<{
  type: 'image';
  image: string;
  mimeType?: string;
}>, modelSupportsImages: boolean): Message[] {
  if (!modelSupportsImages || images.length === 0) {
    return messages;
  }

  // Add images to the most recent user message
  const messagesWithImages = [...messages];
  const lastMessageIndex = messagesWithImages.length - 1;
  const lastMessage = messagesWithImages[lastMessageIndex];

  if (lastMessage && lastMessage.role === 'user') {
    // Convert string content to array format with text and images
    const textContent = typeof lastMessage.content === 'string' ? lastMessage.content : 
      Array.isArray(lastMessage.content) ? 
        (lastMessage.content as Array<{ type: 'text'; text: string }>).find(part => part.type === 'text')?.text || '' :
        String(lastMessage.content);

    const textPart = {
      type: 'text' as const,
      text: textContent
    };

    messagesWithImages[lastMessageIndex] = {
      ...lastMessage,
      content: [textPart, ...images]
    };
  }

  return messagesWithImages;
}

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

  const [error, modelAndProvider] = await getModelAndProviderWithResult({
    modelId,
    federalStateId: user.federalState.id,
  });

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

  const orderedChunks = await getRelevantFileContent({ messages, user, relatedFileEntities });

  // Extract images from attached files and convert to base64
  const extractedImages = await extractImagesAsBase64(relatedFileEntities);

  // Check if the model supports images based on supportedImageFormats
  const modelSupportsImages = definedModel.supportedImageFormats && 
    definedModel.supportedImageFormats.length > 0 &&
    extractedImages.length > 0;

  console.log(`Extracted ${extractedImages.length} images from ${relatedFileEntities.length} files`);
  console.log(`Model ${definedModel.displayName} supports images: ${!!definedModel.supportedImageFormats?.length}`);
  console.log(`Using images in chat: ${modelSupportsImages}`);

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
  const messagesWithImages = formatMessagesWithImages(prunedMessages, extractedImages, modelSupportsImages);

  const result = streamText({
    model: telliProvider,
    system: systemPrompt,
    messages: messagesWithImages.map((m) => ({ role: m.role, content: m.content })),
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
        const { text } = await generateText({
          model: telliProvider,
          system: `Du erstellst einen kurzen Titel basierend auf der ersten Nachricht eines Nutzers
Stelle sicher, dass er nicht länger als 80 Zeichen ist
Der Titel sollte eine Zusammenfassung der Nachricht sein
Verwende keine Anführungszeichen oder Doppelpunkte`,
          messages,
        });

        if (text || conversation.name === null) {
          await dbUpdateConversationTitle({
            name: text,
            conversationId: conversation.id,
            userId: user.id,
          });
        }
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
