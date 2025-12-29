'use server';

import { generateTextStreamWithBilling, type Message as AiCoreMessage } from '@telli/ai-core';
import { createTextStream } from '@/utils/streaming';
import { getUserAndContextByUserId } from '@/auth/utils';
import { checkProductAccess } from '@/utils/vidis/access';
import {
  sharedCharacterChatHasReachedIntelliPointLimit,
  sharedChatHasExpired,
  userHasReachedIntelliPointLimit,
} from '../chat/usage';
import { getModelAndApiKeyWithResult } from '../utils/utils';
import {
  dbGetCharacterByIdAndInviteCode,
  dbUpdateTokenUsageByCharacterChatId,
} from '@shared/db/functions/character';
import { dbGetRelatedCharacterFiles } from '@shared/db/functions/files';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { constructCharacterSystemPrompt } from './system-prompt';
import { limitChatHistory } from '../chat/utils';
import { getRelevantFileContent } from '../file-operations/retrieval';
import { webScraperExecutable } from '../conversation/tools/websearch/search-web';
import { logError } from '@shared/logging';
import {
  KEEP_FIRST_MESSAGES,
  KEEP_RECENT_MESSAGES,
  TOTAL_CHAT_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
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
    if (msg.role === 'system') continue;
    result.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  return result;
}

/**
 * Server Action to send a character chat message and stream the response.
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
  if (character?.userId === undefined || character.userId === null) {
    throw new Error('Could not get character');
  }

  // Get teacher user context
  const teacherUserAndContext = await getUserAndContextByUserId({ userId: character.userId });
  const productAccess = checkProductAccess(teacherUserAndContext);

  if (!productAccess.hasAccess) {
    throw new Error(productAccess.errorType);
  }

  if (teacherUserAndContext.school.userRole !== 'teacher') {
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
    throw new Error('Shared character chat has reached end of life');
  }

  // Check limits
  const [sharedChatLimitReached, intelliPointsLimitReached] = await Promise.all([
    sharedCharacterChatHasReachedIntelliPointLimit({
      user: teacherUserAndContext,
      character,
    }),
    userHasReachedIntelliPointLimit({ user: teacherUserAndContext }),
  ]);

  if (sharedChatLimitReached) {
    throw new Error('Shared character chat has reached intelli points limit');
  }

  if (intelliPointsLimitReached) {
    await sendRabbitmqEvent(
      constructTelliBudgetExceededEvent({
        anonymous: true,
        user: teacherUserAndContext,
        character,
      }),
    );
    throw new Error('User has reached intelli points limit');
  }

  // Get related files and web sources
  const relatedFileEntities = await dbGetRelatedCharacterFiles(character.id);
  const urls = character.attachedLinks.filter((l) => l !== '');
  const websearchSources = await Promise.all(urls.map((url) => webScraperExecutable(url)));

  const orderedChunks = await getRelevantFileContent({
    messages: messages.map<ChatMessage>((m) => ({ id: m.id, role: m.role, content: m.content })),
    user: teacherUserAndContext,
    relatedFileEntities,
    modelId: definedModel.id,
    apiKeyId,
  });

  // Build system prompt
  const systemPrompt = constructCharacterSystemPrompt({
    character,
    retrievedTextChunks: orderedChunks,
    websearchSources,
  });

  // Prune messages
  const prunedMessages = limitChatHistory({
    messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
    limitRecent: KEEP_RECENT_MESSAGES,
    limitFirst: KEEP_FIRST_MESSAGES,
    characterLimit: TOTAL_CHAT_LENGTH_LIMIT,
  });

  // Convert to ai-core format
  const aiCoreMessages = convertToAiCoreMessages(systemPrompt, prunedMessages as ChatMessage[]);

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
            constructTelliNewMessageEvent({
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
