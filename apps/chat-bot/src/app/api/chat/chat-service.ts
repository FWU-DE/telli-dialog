import {
  generateTextStreamWithBilling,
  type Message as AiCoreMessage,
  type TokenUsage,
  TokenPointsExceededError,
  type ToolDefinition,
  runAgentLoop,
} from '@ais-chat/ai-core';
import { createTextStream, encodeChatStreamEvent } from '@/utils/streaming';
import { userHasReachedTokenPointsLimit } from './usage';
import { getModelAndApiKeyWithResult, getAuxiliaryModel } from '../utils/utils';
import {
  dbGetConversationAndMessages,
  dbGetOrCreateConversation,
  dbUpdateConversationTitle,
  dbInsertChatContent,
  dbInsertChatContentBatch,
} from '@shared/db/functions/chat';
import { dbInsertConversationUsage } from '@shared/db/functions/token-usage';
import { dbUpdateLastUsedModelByUserId } from '@shared/db/functions/user';
import { dbGetAttachedFileByEntityId, linkFilesToConversation } from '@shared/db/functions/files';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructNewMessageEvent } from '@/rabbitmq/events/new-message';
import { constructTokenBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { constructChatSystemPrompt } from './system-prompt';
import {
  convertToAiCoreMessages,
  determineImageAttachmentTypeForModel,
  enrichMessagesWithImageData,
  getChatTitle,
  limitChatHistory,
} from './utils';
import { convertMessageModelToMessage } from '@/utils/chat/messages';
import { retrieveChunks } from '../rag/rag-service';
import { logError } from '@shared/logging';
import { ChatMessage, SendMessageResult, createErrorResult } from '@/types/chat';
import { extractUrls } from '../utils/extract-urls';
import { UserAndContext } from '@/auth/types';
import { createImageAttachmentsForConversation } from '../file-operations/preprocess-image';
import { ingestWebContent } from '../rag/ingestWebContent';
import { buildTools } from './build-tools';
import { runWebSearchPipeline } from './websearch';
import type { WebSearchResult } from '@shared/db/schema';
import type {
  AssistantSelectModel,
  CharacterSelectModel,
  LearningScenarioSelectModel,
} from '@shared/db/schema';
import { RetrievedChunk } from '../rag/types';
import { NotFoundError } from '@shared/error';
import { getCharacterForChatSession } from '@shared/characters/character-service';
import { getLearningScenarioForChatSession } from '@shared/learning-scenarios/learning-scenario-service';
import { getAssistantForNewChat } from '@shared/assistants/assistant-service';
import { deepEqual } from '@/utils/object';

type CustomChatIds = {
  characterId?: string | undefined;
  learningScenarioId?: string | undefined;
  assistantId?: string | undefined;
};

function ensureConversationCustomChatIdsMatch({
  incomingIds,
  storedIds,
}: {
  incomingIds: CustomChatIds;
  storedIds: CustomChatIds;
}) {
  if (!deepEqual(incomingIds, storedIds)) {
    throw new NotFoundError('Conversation not found');
  }
}

/**
 * Server Action to send a chat message and stream the response.
 * Returns a streamable value that the client can consume.
 */
export async function sendChatMessage({
  conversationId,
  messages,
  modelId,
  characterId,
  learningScenarioId,
  assistantId,
  fileIds,
  user,
}: {
  conversationId: string;
  messages: ChatMessage[];
  modelId: string;
  characterId?: string;
  learningScenarioId?: string;
  assistantId?: string;
  fileIds?: string[];
  user: UserAndContext;
}): Promise<SendMessageResult> {
  // Get model and API key
  const [error, modelAndApiKey] = await getModelAndApiKeyWithResult({
    modelId,
    federalStateId: user.federalState.id,
  });

  if (error !== null) {
    throw new Error(error.message);
  }

  const { model: definedModel, apiKeyId } = modelAndApiKey;

  // Get auxiliary model for title generation
  const auxiliaryModel = await getAuxiliaryModel(user.federalState.id);
  const [errorAux, auxiliaryModelAndApiKey] = await getModelAndApiKeyWithResult({
    modelId: auxiliaryModel.id,
    federalStateId: user.federalState.id,
  });

  if (errorAux !== null) {
    throw new Error(errorAux.message);
  }

  const activeAuxiliaryModelAndApiKey = auxiliaryModelAndApiKey;

  let activeCharacter: CharacterSelectModel | undefined;
  let activeLearningScenario: LearningScenarioSelectModel | undefined;
  let activeAssistant: AssistantSelectModel | undefined;

  if (characterId !== undefined) {
    activeCharacter = await getCharacterForChatSession({
      characterId,
      user,
    });

    if (activeCharacter.suspended) {
      throw new NotFoundError('Character not found');
    }
  }

  if (learningScenarioId !== undefined) {
    activeLearningScenario = await getLearningScenarioForChatSession({
      learningScenarioId,
      user,
    });

    if (activeLearningScenario.suspended) {
      throw new NotFoundError('Learning scenario not found');
    }
  }

  if (assistantId !== undefined) {
    activeAssistant = await getAssistantForNewChat({
      assistantId,
      user,
    });

    if (activeAssistant.suspended) {
      throw new NotFoundError('Assistant not found');
    }
  }

  // Get or create conversation
  const conversation = await dbGetOrCreateConversation({
    conversationId,
    userId: user.id,
    characterId,
    learningScenarioId,
    assistantId,
  });

  if (conversation === undefined) {
    throw new Error('Could not get or create conversation');
  }

  const activeConversation = conversation;

  const conversationObject = await dbGetConversationAndMessages({
    conversationId: activeConversation.id,
    userId: user.id,
  });

  if (conversationObject === undefined) {
    throw new Error('Could not get conversation object');
  }

  const activeConversationObject = conversationObject;
  const agenticChatEnabled = user.federalState.featureToggles.isAgenticChatEnabled ?? false;

  ensureConversationCustomChatIdsMatch({
    incomingIds: { characterId, learningScenarioId, assistantId },
    storedIds: {
      characterId: activeConversation.characterId ?? undefined,
      learningScenarioId: activeConversation.learningScenarioId ?? undefined,
      assistantId: activeConversation.assistantId ?? undefined,
    },
  });

  // Check budget limit after we have the conversation for proper event tracking
  if (await userHasReachedTokenPointsLimit({ user })) {
    await sendRabbitmqEvent(
      constructTokenBudgetExceededEvent({
        anonymous: false,
        user,
        conversation,
      }),
    );
    return createErrorResult(new TokenPointsExceededError());
  }

  // Get the user message (last message should be from user)
  const userMessage = messages[messages.length - 1];
  if (!userMessage || userMessage.role !== 'user') {
    throw new Error('No user message found');
  }

  const activeUserMessage = userMessage;

  // Use the max existing orderNumber from DB for the next message orderNumber
  const dbMessageCount =
    activeConversationObject.messages[activeConversationObject.messages.length - 1]?.orderNumber ??
    0;

  // Save user message to DB
  await dbInsertChatContent({
    conversationId: activeConversation.id,
    id: userMessage.id,
    content: userMessage.content,
    role: 'user',
    userId: user.id,
    modelName: definedModel.name,
    orderNumber: dbMessageCount + 1,
  });

  // Link files to conversation
  if (fileIds && fileIds.length > 0) {
    await linkFilesToConversation({
      fileIds,
      conversationMessageId: userMessage.id,
      conversationId: conversation.id,
    });
  }

  // Get related files and content
  const relatedFileEntities = await dbGetAttachedFileByEntityId({
    conversationId: conversation.id,
    characterId,
    learningScenarioId,
    assistantId,
  });

  let webSearchResults: WebSearchResult[] = [];
  let chunks: RetrievedChunk[] = [];
  let errorUrls: string[] = [];
  let toolRegistry:
    | Record<
        string,
        { definition: ToolDefinition; handler: (args: Record<string, unknown>) => Promise<string> }
      >
    | undefined;
  let activeToolDefinitions: ToolDefinition[] = [];

  const urls = extractUrls({
    assistant: activeAssistant,
    character: activeCharacter,
    learningScenario: activeLearningScenario,
    messages,
  });
  const ingestResult = await ingestWebContent({
    urls,
    federalStateId: user.federalState.id,
  });
  errorUrls = ingestResult.errorUrls;

  if (agenticChatEnabled) {
    const attachedLinks =
      activeAssistant?.attachedLinks ??
      activeCharacter?.attachedLinks ??
      activeLearningScenario?.attachedLinks ??
      [];

    const builtTools = await buildTools({
      user,
      characterId,
      learningScenarioId,
      assistantId,
      conversationId: activeConversation.id,
      relatedFileEntities,
      attachedLinks,
      sourceUrls: ingestResult.processedUrls,
      onWebSearchResults: (results) => {
        update(
          encodeChatStreamEvent({
            type: 'web_search_results',
            webSearchResults: results,
          }),
        );
      },
    });

    webSearchResults = builtTools.webSearchResults;
    toolRegistry = builtTools.toolRegistry;
    activeToolDefinitions = Object.values(toolRegistry).map((entry) => entry.definition);
  } else {
    // Fallback implementations of Websearch and Chunk Retrieval.
    webSearchResults = await runWebSearchPipeline({
      messages,
      user,
      characterId,
      learningScenarioId,
      assistantId,
      modelId: auxiliaryModel.id,
      apiKeyId: activeAuxiliaryModelAndApiKey.apiKeyId,
      conversationId: activeConversation.id,
    });
    chunks = await retrieveChunks({
      messages,
      federalStateId: user.federalState.id,
      relatedFileEntities,
      sourceUrls: ingestResult.processedUrls,
    });
  }

  // Update last used model
  await dbUpdateLastUsedModelByUserId({ modelName: definedModel.name, userId: user.id });

  // Use DB messages as source of truth — they include intermediate tool call/result
  // messages from the agent loop that the client doesn't track
  const fullMessages: ChatMessage[] = [
    ...convertMessageModelToMessage(activeConversationObject.messages),
    userMessage,
  ];

  // Prune messages
  const prunedMessages = limitChatHistory(fullMessages);

  // Build system prompt
  const systemPrompt = constructChatSystemPrompt({
    character: activeCharacter,
    learningScenario: activeLearningScenario,
    assistant: activeAssistant,
    isTeacher: user.userRole === 'teacher',
    federalState: user.federalState,
    chunks,
    errorUrls,
    webSearchResults,
    activeToolDefinitions,
  });

  // Check if the model supports images based on supportedImageFormats
  const modelSupportsImages =
    definedModel.supportedImageFormats !== null && definedModel.supportedImageFormats.length > 0;

  const imageAttachmentType = determineImageAttachmentTypeForModel(definedModel);

  // attach the image url to each of the image files within relatedFileEntities
  const extractedImages = await createImageAttachmentsForConversation(
    relatedFileEntities,
    imageAttachmentType,
  );

  // Format messages with images if the model supports vision
  const messagesWithImages = enrichMessagesWithImageData(
    prunedMessages,
    extractedImages,
    modelSupportsImages,
    imageAttachmentType,
  );

  // Convert to ai-core format
  const aiCoreMessages = convertToAiCoreMessages(systemPrompt, messagesWithImages);

  // Create native stream
  const { stream, update, done, error: streamError } = createTextStream();
  const assistantMessageId = crypto.randomUUID();
  const assistantMessageOrderNumber = dbMessageCount + 2;

  async function persistAssistantMessage({
    fullText,
    usage,
    priceInCents,
    agentLoopMessages = [],
  }: {
    fullText: string;
    usage: TokenUsage;
    priceInCents: number;
    agentLoopMessages?: AiCoreMessage[];
  }) {
    // Persist intermediate tool call/result messages and the final assistant message in one query
    const messagesToInsert = [
      ...agentLoopMessages.map((msg, index) => ({
        content: msg.content,
        role: msg.role,
        userId: user.id,
        orderNumber: assistantMessageOrderNumber + index,
        modelName: definedModel.name,
        conversationId: activeConversation.id,
        toolCalls: msg.toolCalls ?? null,
        toolCallId: msg.toolCallId ?? null,
      })),
      {
        id: assistantMessageId,
        content: fullText,
        role: 'assistant' as const,
        userId: user.id,
        orderNumber: assistantMessageOrderNumber + agentLoopMessages.length,
        modelName: definedModel.name,
        conversationId: activeConversation.id,
        webSearchResults,
      },
    ];

    await dbInsertChatContentBatch(messagesToInsert);

    if (messages.length <= 2 || activeConversation.name === null) {
      const chatTitle = await getChatTitle({
        modelId: auxiliaryModel.id,
        apiKeyId: activeAuxiliaryModelAndApiKey.apiKeyId,
        message: activeUserMessage,
      });
      await dbUpdateConversationTitle({
        name: chatTitle,
        conversationId: activeConversation.id,
        userId: user.id,
      });
    }

    const { promptTokens, completionTokens } = usage;

    await dbInsertConversationUsage({
      conversationId: activeConversation.id,
      userId: user.id,
      modelId: definedModel.id,
      completionTokens,
      promptTokens,
      costsInCent: priceInCents,
    });

    await sendRabbitmqEvent(
      constructNewMessageEvent({
        user,
        promptTokens,
        completionTokens,
        costsInCent: priceInCents,
        provider: definedModel.provider,
        anonymous: false,
        conversation: activeConversation,
      }),
    );
  }

  async function persistEmptyAssistantMessage() {
    await dbInsertChatContent({
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      userId: user.id,
      orderNumber: assistantMessageOrderNumber,
      modelName: definedModel.name,
      conversationId: activeConversation.id,
    });
  }

  if (agenticChatEnabled) {
    // Start the agent loop in the background
    runAgentLoop({
      modelId: definedModel.id,
      apiKeyId,
      messages: aiCoreMessages,
      toolRegistry,
      onTextChunk: (delta: string) => {
        update(delta);
      },
      onComplete: async ({ fullText, usage, priceInCents, agentLoopMessages }) => {
        try {
          await persistAssistantMessage({ fullText, usage, priceInCents, agentLoopMessages });
          done();
        } catch (error) {
          logError('Error during agent loop completion:', error);
          streamError(error instanceof Error ? error : new Error('Unknown error'));
        }
      },
      onError: async (error: Error) => {
        await persistEmptyAssistantMessage();

        streamError(error);
      },
    });
  } else {
    void (async () => {
      let fullText = '';

      try {
        const textStream = generateTextStreamWithBilling(
          definedModel.id,
          aiCoreMessages,
          apiKeyId,
          async ({ usage, priceInCents }) => {
            await persistAssistantMessage({ fullText, usage, priceInCents });
          },
        );

        for await (const chunk of textStream) {
          fullText += chunk;
          update(chunk);
        }

        done();
      } catch (error) {
        logError('Error during chat streaming:', error);

        await persistEmptyAssistantMessage();

        streamError(error instanceof Error ? error : new Error('Unknown error'));
      }
    })();
  }

  return {
    stream,
    messageId: assistantMessageId,
    webSearchResults,
  };
}
