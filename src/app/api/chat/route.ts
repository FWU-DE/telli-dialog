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
import { getModelAndProviderWithResult } from '../utils';
import { generateUUID } from '@/utils/uuid';
import { getMostRecentUserMessage, limitChatHistory } from './utils';
import { constructChatSystemPrompt } from './system-prompt';
import { checkProductAccess } from '@/utils/vidis/access';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { dbUpdateLastUsedModelByUserId } from '@/db/functions/user';
import {
  dbGetAllFileIdByConversationId,
  dbGetAttachedFileByEntityId,
  link_file_to_conversation,
} from '@/db/functions/files';
import { process_files } from '../file-operations/process-file';
import { FileModelAndContent } from '@/db/schema';

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
  let attachedFiles: FileModelAndContent[] = [];
  if (currentFileIds !== undefined) {
    await link_file_to_conversation({
      fileIds: currentFileIds,
      conversationMessageId: userMessage.id,
      conversationId: conversation.id,
    });
  }
  const allFileIds = await dbGetAttachedFileByEntityId({
    conversationId: conversation.id,
    characterId,
    customGptId,
  });
  attachedFiles = await process_files(allFileIds);
  await dbUpdateLastUsedModelByUserId({ modelName: definedModel.name, userId: user.id });
  const prunedMessages = limitChatHistory({ messages, limitRecent: 4, limitFirst: 4 });
  const systemPrompt = await constructChatSystemPrompt({
    characterId,
    customGptId,
    isTeacher: user.school.userRole === 'teacher',
    federalState: user.federalState,
    attachedFiles: attachedFiles,
  });
  const result = streamText({
    model: telliProvider,
    system: systemPrompt,
    messages: prunedMessages.map((m) => ({ role: m.role, content: m.content })),
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
