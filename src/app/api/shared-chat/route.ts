import { type Message, smoothStream, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAndContextByUserId } from '@/auth/utils';
import {
  sharedChatHasExpired,
  sharedChatHasReachedIntelliPointLimit,
  userHasReachedIntelliPointLimit,
} from '../chat/usage';
import { dbGetSharedChatByIdAndInviteCode } from '@/db/functions/shared-school-chat';
import { constructSystemPromptBySharedChat } from './system-prompt';
import { dbUpdateTokenUsageBySharedChatId } from '@/db/functions/shared-school-chat';
import {
  getModelAndProviderWithResult,
  getSearchParamsFromUrl,
  calculateCostsInCents,
} from '../utils';
import { checkProductAccess } from '@/utils/vidis/access';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { dbGetRelatedSharedChatFiles } from '@/db/functions/files';
import { webScraperExecutable } from '../conversation/tools/websearch/search-web';
import { getRelevantFileContent } from '../file-operations/retrieval';

export async function POST(request: NextRequest) {
  const { messages, modelId }: { messages: Array<Message>; modelId: string } = await request.json();

  const { sharedChatId, inviteCode } = getSearchParamsOrThrow(request.url);
  const sharedChat = await dbGetSharedChatByIdAndInviteCode({ id: sharedChatId, inviteCode });

  if (sharedChat === undefined) {
    return NextResponse.json({ error: 'Could not get shared chat' }, { status: 404 });
  }

  const teacherUserAndContext = await getUserAndContextByUserId({ userId: sharedChat.userId });
  // check for product access
  const productAccess = checkProductAccess(teacherUserAndContext);

  if (!productAccess.hasAccess) {
    return NextResponse.json({ error: productAccess.errorType }, { status: 403 });
  }

  if (teacherUserAndContext.school.userRole !== 'teacher') {
    return NextResponse.json(
      { error: 'The user assigned to this chat is not a teacher. This should never happen.' },
      { status: 500 },
    );
  }
  const [error, modelAndProvider] = await getModelAndProviderWithResult({
    modelId,
    federalStateId: teacherUserAndContext.federalState.id,
  });

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { telliProvider, definedModel } = modelAndProvider;

  if (sharedChatHasExpired(sharedChat)) {
    return NextResponse.json({ error: 'Shared chat has reached end of life' }, { status: 400 });
  }

  const [sharedChatLimitReached, intelliPointsLimitReached] = await Promise.all([
    sharedChatHasReachedIntelliPointLimit({
      user: teacherUserAndContext,
      sharedChat,
    }),
    userHasReachedIntelliPointLimit({ user: teacherUserAndContext }),
  ]);

  if (sharedChatLimitReached) {
    return NextResponse.json(
      { error: 'Shared chat has reached intelli points limit' },
      { status: 429 },
    );
  }

  if (intelliPointsLimitReached) {
    await sendRabbitmqEvent(
      constructTelliBudgetExceededEvent({
        anonymous: true,
        user: teacherUserAndContext,
        sharedChat,
      }),
    );
    return NextResponse.json({ error: 'User has reached intelli points limit' }, { status: 429 });
  }
  const relatedFileEntities = await dbGetRelatedSharedChatFiles(sharedChat.id);
  const urls = sharedChat.attachedLinks.filter((l) => l !== '').map(webScraperExecutable);

  const retrievedTextChunks = await getRelevantFileContent({
    model: telliProvider,
    messages,
    user: teacherUserAndContext,
    relatedFileEntities,
  });

  const websearchSources = await Promise.all(urls);
  const systemPrompt = constructSystemPromptBySharedChat({
    sharedChat,
    retrievedTextChunks,
    websearchSources,
  });

  const result = streamText({
    model: telliProvider,
    system: systemPrompt,
    messages,
    experimental_transform: smoothStream({ chunking: 'word' }),
    async onFinish(assistantMessage) {
      await dbUpdateTokenUsageBySharedChatId({
        modelId: definedModel.id,
        completionTokens: assistantMessage.usage.completionTokens,
        promptTokens: assistantMessage.usage.promptTokens,
        sharedSchoolConversationId: sharedChat.id,
        userId: teacherUserAndContext.id,
      });

      await sendRabbitmqEvent(
        constructTelliNewMessageEvent({
          user: teacherUserAndContext,
          provider: modelAndProvider.definedModel.provider,
          promptTokens: assistantMessage.usage.promptTokens,
          completionTokens: assistantMessage.usage.completionTokens,
          costsInCents: calculateCostsInCents(definedModel, assistantMessage.usage),
          anonymous: true,
          sharedChat,
        }),
      );
    },
  });

  return result.toDataStreamResponse();
}

function getSearchParamsOrThrow(url: string) {
  const searchParams = getSearchParamsFromUrl(url);

  const sharedChatId = searchParams.get('id')?.toString();
  const inviteCode = searchParams.get('inviteCode')?.toString();

  if (sharedChatId === undefined || inviteCode === undefined) {
    throw Error(
      `Expected 'id' and 'inviteCode' to be present in search params but found: ${searchParams.toString()}`,
    );
  }

  return { sharedChatId, inviteCode };
}
