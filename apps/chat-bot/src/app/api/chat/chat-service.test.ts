import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '@/types/chat';
import type { UserAndContext } from '@/auth/types';

const webSearchResults = [
  {
    type: 'text' as const,
    name: 'Search result',
    url: 'https://example.com/article',
    content: 'Current details from the web search.',
    favicon: 'https://example.com/favicon.ico',
  },
];

const buildToolsOutput = {
  tools: [
    {
      name: 'web_search',
      description: 'web search tool',
      parameters: {},
    },
  ],
  toolHandlers: {
    web_search: vi.fn(),
  },
  webSearchResults,
};

const mocks = vi.hoisted(() => ({
  generateTextStreamWithBillingMock: vi.fn(),
  generateAgenticStreamWithBillingMock: vi.fn(),
  runAgentLoopMock: vi.fn(),
  buildToolsMock: vi.fn(),
  runWebSearchPipelineMock: vi.fn(),
  constructChatSystemPromptMock: vi.fn(),
  getModelAndApiKeyWithResultMock: vi.fn(),
  getAuxiliaryModelMock: vi.fn(),
  dbGetConversationAndMessagesMock: vi.fn(),
  dbGetOrCreateConversationMock: vi.fn(),
  dbUpdateConversationTitleMock: vi.fn(),
  dbInsertChatContentMock: vi.fn(),
  dbInsertChatContentBatchMock: vi.fn(),
  dbInsertConversationUsageMock: vi.fn(),
  dbUpdateLastUsedModelByUserIdMock: vi.fn(),
  dbGetAttachedFileByEntityIdMock: vi.fn(),
  linkFilesToConversationMock: vi.fn(),
  sendRabbitmqEventMock: vi.fn(),
  constructNewMessageEventMock: vi.fn(),
  constructTokenBudgetExceededEventMock: vi.fn(),
  convertToAiCoreMessagesMock: vi.fn(),
  formatMessagesWithImagesMock: vi.fn(),
  getChatTitleMock: vi.fn(),
  limitChatHistoryMock: vi.fn(),
  retrieveChunksMock: vi.fn(),
  extractUrlsMock: vi.fn(),
  extractImagesAndUrlMock: vi.fn(),
  ingestWebContentMock: vi.fn(),
  userHasReachedTokenPointsLimitMock: vi.fn(),
  logErrorMock: vi.fn(),
  getCharacterForChatSessionMock: vi.fn(),
  getLearningScenarioForChatSessionMock: vi.fn(),
  getAssistantForNewChatMock: vi.fn(),
}));

vi.mock('@ais-chat/ai-core', () => ({
  generateTextStreamWithBilling: mocks.generateTextStreamWithBillingMock,
  generateAgenticStreamWithBilling: mocks.generateAgenticStreamWithBillingMock,
  TokenPointsExceededError: class TokenPointsExceededError extends Error {},
}));

vi.mock('./build-tools', () => ({
  buildTools: mocks.buildToolsMock,
}));

vi.mock('./agent-loop', () => ({
  runAgentLoop: mocks.runAgentLoopMock,
}));

vi.mock('./websearch', () => ({
  runWebSearchPipeline: mocks.runWebSearchPipelineMock,
}));

vi.mock('./usage', () => ({
  userHasReachedTokenPointsLimit: mocks.userHasReachedTokenPointsLimitMock,
}));

vi.mock('../utils/utils', () => ({
  getModelAndApiKeyWithResult: mocks.getModelAndApiKeyWithResultMock,
  getAuxiliaryModel: mocks.getAuxiliaryModelMock,
}));

vi.mock('@shared/db/functions/chat', () => ({
  dbGetConversationAndMessages: mocks.dbGetConversationAndMessagesMock,
  dbGetOrCreateConversation: mocks.dbGetOrCreateConversationMock,
  dbUpdateConversationTitle: mocks.dbUpdateConversationTitleMock,
  dbInsertChatContent: mocks.dbInsertChatContentMock,
  dbInsertChatContentBatch: mocks.dbInsertChatContentBatchMock,
}));

vi.mock('@shared/db/functions/token-usage', () => ({
  dbInsertConversationUsage: mocks.dbInsertConversationUsageMock,
}));

vi.mock('@shared/db/functions/user', () => ({
  dbUpdateLastUsedModelByUserId: mocks.dbUpdateLastUsedModelByUserIdMock,
}));

vi.mock('@shared/db/functions/files', () => ({
  dbGetAttachedFileByEntityId: mocks.dbGetAttachedFileByEntityIdMock,
  linkFilesToConversation: mocks.linkFilesToConversationMock,
}));

vi.mock('@/rabbitmq/send', () => ({
  sendRabbitmqEvent: mocks.sendRabbitmqEventMock,
}));

vi.mock('@/rabbitmq/events/new-message', () => ({
  constructNewMessageEvent: mocks.constructNewMessageEventMock,
}));

vi.mock('@/rabbitmq/events/budget-exceeded', () => ({
  constructTokenBudgetExceededEvent: mocks.constructTokenBudgetExceededEventMock,
}));

vi.mock('./system-prompt', () => ({
  constructChatSystemPrompt: mocks.constructChatSystemPromptMock,
}));

vi.mock('./utils', () => ({
  convertToAiCoreMessages: mocks.convertToAiCoreMessagesMock,
  formatMessagesWithImages: mocks.formatMessagesWithImagesMock,
  getChatTitle: mocks.getChatTitleMock,
  limitChatHistory: mocks.limitChatHistoryMock,
}));

vi.mock('../rag/rag-service', () => ({
  retrieveChunks: mocks.retrieveChunksMock,
}));

vi.mock('../utils/extract-urls', () => ({
  extractUrls: mocks.extractUrlsMock,
}));

vi.mock('../file-operations/preprocess-image', () => ({
  extractImagesAndUrl: mocks.extractImagesAndUrlMock,
}));

vi.mock('../rag/ingestWebContent', () => ({
  ingestWebContent: mocks.ingestWebContentMock,
}));

vi.mock('@shared/logging', () => ({
  logError: mocks.logErrorMock,
}));

vi.mock('@shared/characters/character-service', () => ({
  getCharacterForChatSession: mocks.getCharacterForChatSessionMock,
}));

vi.mock('@shared/learning-scenarios/learning-scenario-service', () => ({
  getLearningScenarioForChatSession: mocks.getLearningScenarioForChatSessionMock,
}));

vi.mock('@shared/assistants/assistant-service', () => ({
  getAssistantForNewChat: mocks.getAssistantForNewChatMock,
}));

const mainModel = {
  id: 'model-main',
  name: 'Main model',
  provider: 'mock-provider',
  supportedImageFormats: [],
};

const auxiliaryModel = {
  id: 'model-aux',
  name: 'Auxiliary model',
  provider: 'mock-provider',
  supportedImageFormats: [],
};

const conversation = {
  id: 'conversation-1',
  name: 'Existing conversation',
};

const conversationObject = {
  messages: [{ id: 'existing-message' }],
};

const messages: ChatMessage[] = [
  { id: 'message-1', role: 'user', content: 'Earlier question' },
  { id: 'message-2', role: 'assistant', content: 'Earlier answer' },
  { id: 'message-3', role: 'user', content: 'Current question' },
];

function createUser(isAgenticChatEnabled: boolean): UserAndContext {
  return {
    id: 'user-1',
    userRole: 'teacher',
    federalState: {
      id: 'federal-state-1',
      supportContacts: null,
      chatStorageTime: 120,
      featureToggles: {
        isStudentAccessEnabled: true,
        isCharacterEnabled: true,
        isSharedChatEnabled: true,
        isCustomGptEnabled: true,
        isShareTemplateWithSchoolEnabled: true,
        isAgenticChatEnabled,
        isImageGenerationEnabled: true,
        isWebSearchEnabled: true,
      },
    },
  } as UserAndContext;
}

async function collectStream(stream: ReadableStream<string>) {
  const reader = stream.getReader();
  const chunks: string[] = [];

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value !== undefined) chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return chunks.join('');
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.getModelAndApiKeyWithResultMock.mockImplementation(
    async ({ modelId }: { modelId: string }) => {
      if (modelId === mainModel.id) {
        return [null, { model: mainModel, apiKeyId: 'api-main' }];
      }

      if (modelId === auxiliaryModel.id) {
        return [null, { model: auxiliaryModel, apiKeyId: 'api-aux' }];
      }

      throw new Error(`Unexpected model id: ${modelId}`);
    },
  );
  mocks.getAuxiliaryModelMock.mockResolvedValue(auxiliaryModel);
  mocks.dbGetOrCreateConversationMock.mockResolvedValue(conversation as never);
  mocks.dbGetConversationAndMessagesMock.mockResolvedValue(conversationObject as never);
  mocks.userHasReachedTokenPointsLimitMock.mockResolvedValue(false);
  mocks.extractUrlsMock.mockResolvedValue([]);
  mocks.ingestWebContentMock.mockResolvedValue({ processedUrls: [], errorUrls: [] });
  mocks.dbGetAttachedFileByEntityIdMock.mockResolvedValue([]);
  mocks.retrieveChunksMock.mockResolvedValue([]);
  mocks.limitChatHistoryMock.mockImplementation(
    ({ messages }: { messages: ChatMessage[] }) => messages,
  );
  mocks.convertToAiCoreMessagesMock.mockImplementation(
    (_systemPrompt: unknown, messages: unknown[]) => messages,
  );
  mocks.formatMessagesWithImagesMock.mockImplementation((messages: ChatMessage[]) => messages);
  mocks.extractImagesAndUrlMock.mockResolvedValue([]);
  mocks.constructChatSystemPromptMock.mockResolvedValue('system-prompt');
  mocks.dbInsertChatContentMock.mockResolvedValue(undefined);
  mocks.dbInsertConversationUsageMock.mockResolvedValue(undefined);
  mocks.dbUpdateLastUsedModelByUserIdMock.mockResolvedValue(undefined);
  mocks.dbUpdateConversationTitleMock.mockResolvedValue(undefined);
  mocks.linkFilesToConversationMock.mockResolvedValue(undefined);
  mocks.sendRabbitmqEventMock.mockResolvedValue(undefined);
  mocks.constructNewMessageEventMock.mockReturnValue({ type: 'new-message' });
  mocks.constructTokenBudgetExceededEventMock.mockReturnValue({ type: 'budget-exceeded' });
  mocks.getChatTitleMock.mockResolvedValue('Generated title');
  mocks.logErrorMock.mockImplementation(() => undefined);
  mocks.runWebSearchPipelineMock.mockResolvedValue(webSearchResults as never);
  mocks.buildToolsMock.mockResolvedValue(buildToolsOutput as never);
  mocks.generateTextStreamWithBillingMock.mockImplementation(async function* (
    _modelId: string,
    _messages: unknown[],
    _apiKeyId: string,
    onComplete?: ({
      usage,
      priceInCents,
    }: {
      usage: { promptTokens: number; completionTokens: number; totalTokens: number };
      priceInCents: number;
    }) => Promise<void> | void,
  ) {
    yield 'fallback chunk';
    await onComplete?.({
      usage: { promptTokens: 11, completionTokens: 22, totalTokens: 33 },
      priceInCents: 44,
    });
  });
  mocks.runAgentLoopMock.mockImplementation(
    ({
      onTextChunk,
      onComplete,
      tools,
      toolHandlers,
    }: {
      onTextChunk: (delta: string) => void;
      onComplete: ({
        fullText,
        usage,
        priceInCents,
      }: {
        fullText: string;
        usage: { promptTokens: number; completionTokens: number; totalTokens: number };
        priceInCents: number;
      }) => Promise<void> | void;
      tools?: unknown[];
      toolHandlers?: Record<string, unknown>;
    }) => {
      expect(tools).toEqual(buildToolsOutput.tools);
      expect(toolHandlers).toEqual(buildToolsOutput.toolHandlers);

      onTextChunk('agentic chunk');
      void onComplete({
        fullText: 'agentic chunk',
        usage: { promptTokens: 11, completionTokens: 22, totalTokens: 33 },
        priceInCents: 44,
      });
    },
  );
  mocks.generateAgenticStreamWithBillingMock.mockImplementation(async function* () {
    yield { type: 'text', delta: 'agentic chunk' };
  });
});

describe('sendChatMessage', () => {
  it.each([
    { isAgenticChatEnabled: false, expectedBranch: 'legacy' },
    { isAgenticChatEnabled: true, expectedBranch: 'agentic' },
  ])('routes $expectedBranch chats correctly', async ({ isAgenticChatEnabled }) => {
    const { sendChatMessage } = await import('./chat-service');

    const result = await sendChatMessage({
      conversationId: conversation.id,
      messages,
      modelId: mainModel.id,
      user: createUser(isAgenticChatEnabled),
    });

    const streamedText = await collectStream(result.stream);

    if (isAgenticChatEnabled) {
      expect(mocks.buildToolsMock).toHaveBeenCalledTimes(1);
      expect(mocks.retrieveChunksMock).not.toHaveBeenCalled();
      expect(mocks.runWebSearchPipelineMock).not.toHaveBeenCalled();
      expect(mocks.extractUrlsMock).not.toHaveBeenCalled();
      expect(mocks.ingestWebContentMock).not.toHaveBeenCalled();
      expect(mocks.constructChatSystemPromptMock).toHaveBeenCalledWith(
        expect.objectContaining({ errorUrls: [] }),
      );
      expect(result.webSearchResults).toEqual(webSearchResults);
      expect(streamedText).toBe('agentic chunk');
    } else {
      expect(mocks.buildToolsMock).not.toHaveBeenCalled();
      expect(mocks.runAgentLoopMock).not.toHaveBeenCalled();
      expect(mocks.runWebSearchPipelineMock).toHaveBeenCalledTimes(1);
      expect(mocks.extractUrlsMock).toHaveBeenCalledTimes(1);
      expect(mocks.ingestWebContentMock).toHaveBeenCalledTimes(1);
      expect(result.webSearchResults).toEqual(webSearchResults);
      expect(mocks.constructChatSystemPromptMock).toHaveBeenCalledWith(
        expect.objectContaining({ webSearchResults }),
      );
      expect(streamedText).toBe('fallback chunk');
    }
  });

  it('throws when conversation context ids do not match', async () => {
    const { sendChatMessage } = await import('./chat-service');

    mocks.dbGetOrCreateConversationMock.mockResolvedValue({
      ...conversation,
      characterId: 'character-1',
      learningScenarioId: null,
      assistantId: null,
    } as never);

    await expect(
      sendChatMessage({
        conversationId: conversation.id,
        messages,
        modelId: mainModel.id,
        user: createUser(false),
      }),
    ).rejects.toThrow('Conversation not found');
  });

  it('throws when character is suspended', async () => {
    const { sendChatMessage } = await import('./chat-service');

    const characterId = 'character-1';
    mocks.dbGetOrCreateConversationMock.mockResolvedValue({
      ...conversation,
      characterId,
      learningScenarioId: null,
      assistantId: null,
    } as never);
    mocks.getCharacterForChatSessionMock.mockResolvedValue({ suspended: true } as never);

    await expect(
      sendChatMessage({
        conversationId: conversation.id,
        messages,
        modelId: mainModel.id,
        characterId,
        user: createUser(false),
      }),
    ).rejects.toThrow('Character not found');
  });

  it('throws when learning scenario is suspended', async () => {
    const { sendChatMessage } = await import('./chat-service');

    const learningScenarioId = 'learning-scenario-1';
    mocks.dbGetOrCreateConversationMock.mockResolvedValue({
      ...conversation,
      characterId: null,
      learningScenarioId,
      assistantId: null,
    } as never);
    mocks.getLearningScenarioForChatSessionMock.mockResolvedValue({ suspended: true } as never);

    await expect(
      sendChatMessage({
        conversationId: conversation.id,
        messages,
        modelId: mainModel.id,
        learningScenarioId,
        user: createUser(false),
      }),
    ).rejects.toThrow('Learning scenario not found');
  });

  it('throws when assistant is suspended', async () => {
    const { sendChatMessage } = await import('./chat-service');

    const assistantId = 'assistant-1';
    mocks.dbGetOrCreateConversationMock.mockResolvedValue({
      ...conversation,
      characterId: null,
      learningScenarioId: null,
      assistantId,
    } as never);
    mocks.getAssistantForNewChatMock.mockResolvedValue({ suspended: true } as never);

    await expect(
      sendChatMessage({
        conversationId: conversation.id,
        messages,
        modelId: mainModel.id,
        assistantId,
        user: createUser(false),
      }),
    ).rejects.toThrow('Assistant not found');
  });
});
