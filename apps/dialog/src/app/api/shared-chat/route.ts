import { type Message, smoothStream, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAndContextByUserId } from '@/auth/utils';
import {
  sharedChatHasExpired,
  sharedChatHasReachedIntelliPointLimit,
  userHasReachedIntelliPointLimit,
} from '../chat/usage';
import { dbGetSharedChatByIdAndInviteCode } from '@shared/db/functions/shared-school-chat';
import { constructLearningScenarioSystemPrompt } from './system-prompt';
import { dbUpdateTokenUsageBySharedChatId } from '@shared/db/functions/shared-school-chat';
import {
  getModelAndProviderWithResult,
  getSearchParamsFromUrl,
  calculateCostsInCent,
  getTokenUsage,
} from '../utils/utils';
import { checkProductAccess } from '@/utils/vidis/access';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { dbGetRelatedSharedChatFiles } from '@shared/db/functions/files';
import { webScraperExecutable } from '../conversation/tools/websearch/search-web';
import { getRelevantFileContent } from '../file-operations/retrieval';
import { logError } from '@shared/logging';
import {
  KEEP_RECENT_MESSAGES,
  KEEP_FIRST_MESSAGES,
  TOTAL_CHAT_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { limitChatHistory } from '../chat/utils';

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
  const urls = sharedChat.attachedLinks
    .filter((l) => l !== '')
    .map((url) => webScraperExecutable(url));

  const retrievedTextChunks = await getRelevantFileContent({
    model: telliProvider,
    messages,
    user: teacherUserAndContext,
    relatedFileEntities,
  });

  const websearchSources = await Promise.all(urls);
  const systemPrompt = constructLearningScenarioSystemPrompt({
    sharedChat,
    retrievedTextChunks,
    websearchSources,
  });

  const prunedMessages = limitChatHistory({
    messages,
    limitRecent: KEEP_RECENT_MESSAGES,
    limitFirst: KEEP_FIRST_MESSAGES,
    characterLimit: TOTAL_CHAT_LENGTH_LIMIT,
  });

  const result = streamText({
    model: telliProvider,
    system: systemPrompt,
    messages: prunedMessages,
    experimental_transform: smoothStream({ chunking: 'word', delayInMs: 20 }),
    async onFinish(assistantMessage) {
      const { promptTokens, completionTokens } = getTokenUsage(assistantMessage.usage);
      const costsInCent = calculateCostsInCent(definedModel, { promptTokens, completionTokens });

      await dbUpdateTokenUsageBySharedChatId({
        modelId: definedModel.id,
        completionTokens: completionTokens,
        promptTokens: promptTokens,
        sharedSchoolConversationId: sharedChat.id,
        userId: teacherUserAndContext.id,
        costsInCent: costsInCent,
      });

      await sendRabbitmqEvent(
        constructTelliNewMessageEvent({
          user: teacherUserAndContext,
          provider: modelAndProvider.definedModel.provider,
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          costsInCent: costsInCent,
          anonymous: true,
          sharedChat,
        }),
      );
    },
    async onError(error) {
      logError('Error during streaming shared chat response:', error);
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
