import {
  generateTextStreamWithBilling,
  type Message as AiCoreMessage,
  TokenPointsExceededError,
} from '@ais-chat/ai-core';
import { createTextStream } from '@/utils/streaming';
import { userHasReachedTokenPointsLimit } from '../chat/usage';
import { getModelAndApiKeyWithResult } from '../utils/utils';
import { getLearningScenarioForChatSession } from '@shared/learning-scenarios/learning-scenario-service';
import { dbGetRelatedSharedChatFiles } from '@shared/db/functions/files';
import { dbInsertConversationUsage } from '@shared/db/functions/token-usage';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTokenBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { constructLearningScenarioSystemPrompt } from '../shared-chat/system-prompt';
import { formatMessagesWithImages, limitChatHistory } from '../chat/utils';
import { retrieveChunks } from '../rag/rag-service';
import { logError } from '@shared/logging';
import {
  KEEP_FIRST_MESSAGES,
  KEEP_RECENT_MESSAGES,
  TOTAL_CHAT_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { ChatMessage, SendMessageResult, createErrorResult } from '@/types/chat';
import { extractImagesAndUrl } from '../file-operations/preprocess-image';
import { ingestWebContent } from '../rag/ingestWebContent';
import { UserAndContext } from '@/auth/types';
import { checkParameterUUID } from '@shared/error';

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
 * Teacher-side preview chat for a learning scenario. Mirrors the system prompt
 * and rendering of the student-facing shared chat, but uses authenticated
 * teacher access instead of an invite code and does not persist messages.
 *
 * Usage is still tracked against the teacher's own monthly budget so the
 * preview can't be abused to bypass token limits. There is no per-share
 * token/time limit because no share is involved.
 */
export async function sendLearningScenarioPreviewMessage({
  previewSessionId,
  learningScenarioId,
  messages,
  modelId,
  user,
}: {
  previewSessionId: string;
  learningScenarioId: string;
  messages: ChatMessage[];
  modelId: string;
  user: UserAndContext;
}): Promise<SendMessageResult> {
  // Validate the client-supplied session id so we can't pollute usage tracking
  // rows with arbitrary strings. The id is only used to attribute tokens — userId
  // remains the authoritative anti-IDOR check, this is defense in depth.
  checkParameterUUID(previewSessionId);

  const learningScenario = await getLearningScenarioForChatSession({
    learningScenarioId,
    user,
  });

  const [error, modelAndApiKey] = await getModelAndApiKeyWithResult({
    modelId,
    federalStateId: user.federalState.id,
  });

  if (error !== null) {
    throw new Error(error.message);
  }

  const { model: definedModel, apiKeyId } = modelAndApiKey;

  if (await userHasReachedTokenPointsLimit({ user })) {
    await sendRabbitmqEvent(
      constructTokenBudgetExceededEvent({
        anonymous: false,
        user,
        sharedChat: learningScenario,
      }),
    );
    return createErrorResult(new TokenPointsExceededError());
  }

  const relatedFileEntities = await dbGetRelatedSharedChatFiles(learningScenario.id);
  const urls = learningScenario.attachedLinks.filter((l) => l !== '');
  const { processedUrls } = await ingestWebContent({
    urls,
    federalStateId: user.federalState.id,
  });

  const chunks = await retrieveChunks({
    messages,
    federalStateId: user.federalState.id,
    relatedFileEntities,
    sourceUrls: processedUrls,
  });

  const systemPrompt = constructLearningScenarioSystemPrompt({
    sharedChat: learningScenario,
    chunks,
  });

  const prunedMessages = limitChatHistory({
    messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
    limitRecent: KEEP_RECENT_MESSAGES,
    limitFirst: KEEP_FIRST_MESSAGES,
    characterLimit: TOTAL_CHAT_LENGTH_LIMIT,
  });

  const modelSupportsImages =
    definedModel.supportedImageFormats !== null && definedModel.supportedImageFormats.length > 0;
  const extractedImages = await extractImagesAndUrl(relatedFileEntities);
  const messagesWithImages = formatMessagesWithImages(
    prunedMessages,
    extractedImages,
    modelSupportsImages,
  );

  const aiCoreMessages = convertToAiCoreMessages(systemPrompt, messagesWithImages);

  const { stream, update, done, error: streamError } = createTextStream();
  const assistantMessageId = crypto.randomUUID();

  void (async () => {
    try {
      const textStream = generateTextStreamWithBilling(
        definedModel.id,
        aiCoreMessages,
        apiKeyId,
        async ({ usage, priceInCents }) => {
          const { promptTokens, completionTokens } = usage;

          // Track usage on the teacher's monthly budget. We reuse the
          // conversation_usage_tracking table — the conversationId column has
          // no FK constraint, so the previewSessionId is enough to attribute
          // tokens without persisting a conversation row.
          await dbInsertConversationUsage({
            conversationId: previewSessionId,
            userId: user.id,
            modelId: definedModel.id,
            completionTokens,
            promptTokens,
            costsInCent: priceInCents,
          });

          await sendRabbitmqEvent(
            constructNewMessageEvent({
              user,
              provider: definedModel.provider,
              promptTokens,
              completionTokens,
              costsInCent: priceInCents,
              anonymous: false,
              sharedChat: learningScenario,
            }),
          );
        },
      );

      for await (const chunk of textStream) {
        update(chunk);
      }

      done();
    } catch (error) {
      logError('Error during learning scenario preview streaming:', error);
      streamError(error instanceof Error ? error : new Error('Unknown error'));
    }
  })();

  return {
    stream,
    messageId: assistantMessageId,
  };
}
