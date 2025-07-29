import { type Message, smoothStream, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAndContextByUserId } from '@/auth/utils';
import {
  sharedCharacterChatHasReachedIntelliPointLimit,
  sharedChatHasExpired,
  userHasReachedIntelliPointLimit,
} from '../chat/usage';
import { constructSystemPromptByCharacterSharedChat } from './system-prompt';
import {
  getModelAndProviderWithResult,
  getSearchParamsFromUrl,
  calculateCostsInCents,
} from '../utils';
import {
  dbGetCharacterByIdAndInviteCode,
  dbUpdateTokenUsageByCharacterChatId,
} from '@/db/functions/character';
import { checkProductAccess } from '@/utils/vidis/access';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { dbGetRelatedCharacterFiles } from '@/db/functions/files';
import { getRelevantFileContent } from '../file-operations/retrieval';

export async function POST(request: NextRequest) {
  const { messages, modelId }: { messages: Array<Message>; modelId: string } = await request.json();

  const { sharedChatId, inviteCode } = getSearchParamsOrThrow(request.url);
  const character = await dbGetCharacterByIdAndInviteCode({ id: sharedChatId, inviteCode });
  if (character?.userId === undefined || character.userId === null) {
    return NextResponse.json({ error: 'Could not get shared chat' }, { status: 404 });
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
    modelId,
    federalStateId: teacherUserAndContext.federalState.id,
  });

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { telliProvider, definedModel } = modelAndProvider;

  if (sharedChatHasExpired(character)) {
    return NextResponse.json(
      { error: 'Shared character chat has reached end of life' },
      { status: 400 },
    );
  }

  const [sharedChatLimitReached, intelliPointsLimitReached] = await Promise.all([
    sharedCharacterChatHasReachedIntelliPointLimit({
      user: teacherUserAndContext,
      character,
    }),
    userHasReachedIntelliPointLimit({ user: teacherUserAndContext }),
  ]);

  if (sharedChatLimitReached) {
    return NextResponse.json(
      { error: 'Shared character chat has reached intelli points limit' },
      { status: 429 },
    );
  }

  if (intelliPointsLimitReached) {
    await sendRabbitmqEvent(
      constructTelliBudgetExceededEvent({
        anonymous: true,
        user: teacherUserAndContext,
        character,
      }),
    );
    return NextResponse.json({ error: 'User has reached intelli points limit' }, { status: 429 });
  }

  const relatedFileEntities = await dbGetRelatedCharacterFiles(character.id);
  const orderedChunks = await getRelevantFileContent({
    messages,
    user: teacherUserAndContext,
    relatedFileEntities,
    model: telliProvider,
  });
  const systemPrompt = constructSystemPromptByCharacterSharedChat({
    character,
    retrievedTextChunks: orderedChunks,
  });

  const result = streamText({
    model: telliProvider,
    system: systemPrompt,
    messages,
    experimental_transform: smoothStream({ chunking: 'word' }),
    async onFinish(assistantMessage) {
      await dbUpdateTokenUsageByCharacterChatId({
        modelId: definedModel.id,
        completionTokens: assistantMessage.usage.completionTokens,
        promptTokens: assistantMessage.usage.promptTokens,
        characterId: character.id,
        userId: teacherUserAndContext.id,
      });
      await sendRabbitmqEvent(
        constructTelliNewMessageEvent({
          user: teacherUserAndContext,
          promptTokens: assistantMessage.usage.promptTokens,
          completionTokens: assistantMessage.usage.completionTokens,
          costsInCents: calculateCostsInCents(definedModel, assistantMessage.usage),
          provider: definedModel.provider,
          anonymous: true,
          character,
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
