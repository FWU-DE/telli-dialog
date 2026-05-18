import { generateTextStreamWithBilling, type Message as AiCoreMessage } from '@ais-chat/ai-core';
import type { LearningScenarioSelectModel, LlmModelSelectModel } from '@shared/db/schema';
import { createTextStream } from '@/utils/streaming';
import { dbGetRelatedSharedChatFiles } from '@shared/db/functions/files';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructLearningScenarioSystemPrompt } from './system-prompt';
import { formatMessagesWithImages, limitChatHistory } from '../chat/utils';
import { retrieveChunks } from '../rag/rag-service';
import { logError } from '@shared/logging';
import {
  KEEP_FIRST_MESSAGES,
  KEEP_RECENT_MESSAGES,
  TOTAL_CHAT_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { ChatMessage, SendMessageResult } from '@/types/chat';
import { extractImagesAndUrl } from '../file-operations/preprocess-image';
import { ingestWebContent } from '../rag/ingestWebContent';
import { UserAndContext } from '@/auth/types';

/**
 * Convert frontend chat messages to the ai-core wire format and prepend the
 * scenario system prompt.
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

export type UsageCallback = (args: {
  promptTokens: number;
  completionTokens: number;
  costsInCent: number;
}) => Promise<void>;

/**
 * Run the learning-scenario streaming pipeline: retrieve scenario files +
 * linked web content, build the system prompt with RAG chunks, format with
 * images if the model supports it, and stream the assistant reply.
 *
 * Callers are responsible for auth, expiry, and budget pre-checks. The shared
 * student-facing flow (shared-chat-service) and the teacher-side preview
 * (learning-scenario-preview-service) both go through this helper so the
 * pipeline stays in one place.
 */
export async function streamLearningScenarioReply({
  learningScenario,
  user,
  messages,
  model,
  apiKeyId,
  onUsage,
  eventAnonymous,
  logTag,
}: {
  learningScenario: LearningScenarioSelectModel;
  user: UserAndContext;
  messages: ChatMessage[];
  model: LlmModelSelectModel;
  apiKeyId: string;
  onUsage: UsageCallback;
  eventAnonymous: boolean;
  logTag: string;
}): Promise<SendMessageResult> {
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
    model.supportedImageFormats !== null && model.supportedImageFormats.length > 0;
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
        model.id,
        aiCoreMessages,
        apiKeyId,
        async ({ usage, priceInCents }) => {
          const { promptTokens, completionTokens } = usage;
          await onUsage({ promptTokens, completionTokens, costsInCent: priceInCents });
          await sendRabbitmqEvent(
            constructNewMessageEvent({
              user,
              provider: model.provider,
              promptTokens,
              completionTokens,
              costsInCent: priceInCents,
              anonymous: eventAnonymous,
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
      logError(`Error during ${logTag} streaming:`, error);
      streamError(error instanceof Error ? error : new Error('Unknown error'));
    }
  })();

  return {
    stream,
    messageId: assistantMessageId,
  };
}
