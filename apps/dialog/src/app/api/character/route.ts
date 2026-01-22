import { type Message, smoothStream, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAndContextByUserId } from '@/auth/utils';
import {
  sharedCharacterChatHasReachedTelliPointsLimit,
  sharedChatHasExpired,
  userHasReachedTelliPointsLimit,
} from '../chat/usage';
import { constructCharacterSystemPrompt } from './system-prompt';
import {
  getModelAndProviderWithResult,
  getSearchParamsFromUrl,
  calculateCostsInCent,
  getTokenUsage,
} from '../utils/utils';
import {
  dbGetCharacterByIdAndInviteCode,
  dbUpdateTokenUsageByCharacterChatId,
} from '@shared/db/functions/character';
import { checkProductAccess } from '@/utils/vidis/access';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { dbGetRelatedCharacterFiles } from '@shared/db/functions/files';
import { getRelevantFileContent } from '../file-operations/retrieval';
import { logError } from '@shared/logging';
import {
  KEEP_RECENT_MESSAGES,
  KEEP_FIRST_MESSAGES,
  TOTAL_CHAT_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { limitChatHistory } from '../chat/utils';
import { webScraperCrawl4AI } from '../webpage-content/search-web-crawl4ai';

export async function POST(request: NextRequest) {
  const { messages }: { messages: Array<Message> } = await request.json();

  const { sharedChatId, inviteCode } = getSearchParamsOrThrow(request.url);
  const character = await dbGetCharacterByIdAndInviteCode({ id: sharedChatId, inviteCode });

  if (character === undefined) {
    return NextResponse.json({ error: 'The shared chat was not found.' }, { status: 404 });
  }

  const teacherUserAndContext = await getUserAndContextByUserId({ userId: character.userId });
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
    modelId: character.modelId,
    federalStateId: teacherUserAndContext.federalState.id,
  });

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { telliProvider, definedModel } = modelAndProvider;

  if (sharedChatHasExpired(character)) {
    return NextResponse.json({ error: 'Shared character chat has expired.' }, { status: 400 });
  }

  const [sharedChatLimitReached, telliPointsLimitReached] = await Promise.all([
    sharedCharacterChatHasReachedTelliPointsLimit({
      user: teacherUserAndContext,
      character,
    }),
    userHasReachedTelliPointsLimit({ user: teacherUserAndContext }),
  ]);

  if (sharedChatLimitReached) {
    return NextResponse.json(
      { error: 'Shared character chat has reached telli points limit.' },
      { status: 429 },
    );
  }

  if (telliPointsLimitReached) {
    await sendRabbitmqEvent(
      constructTelliBudgetExceededEvent({
        anonymous: true,
        user: teacherUserAndContext,
        character,
      }),
    );
    return NextResponse.json({ error: 'User has reached telli points limit.' }, { status: 429 });
  }

  const relatedFileEntities = await dbGetRelatedCharacterFiles(character.id);
  const urls = character.attachedLinks
    .filter((l) => l !== '')
    .map((url) => webScraperCrawl4AI(url));
  const orderedChunks = await getRelevantFileContent({
    messages,
    user: teacherUserAndContext,
    relatedFileEntities,
    model: telliProvider,
  });
  const websearchSources = await Promise.all(urls);
  const systemPrompt = constructCharacterSystemPrompt({
    character,
    retrievedTextChunks: orderedChunks,
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

      await dbUpdateTokenUsageByCharacterChatId({
        modelId: definedModel.id,
        completionTokens: completionTokens,
        promptTokens: promptTokens,
        characterId: character.id,
        userId: teacherUserAndContext.id,
        costsInCent: costsInCent,
      });
      await sendRabbitmqEvent(
        constructTelliNewMessageEvent({
          user: teacherUserAndContext,
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          costsInCent: costsInCent,
          provider: definedModel.provider,
          anonymous: true,
          character,
        }),
      );
    },
    async onError(error) {
      logError('Error during streaming character response:', error);
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
