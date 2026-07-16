import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dbInsertConversationToolCallUsageMock: vi.fn(),
  dbUpdateTokenUsageByCharacterChatIdMock: vi.fn(),
  dbUpdateTokenUsageBySharedLearningScenarioIdMock: vi.fn(),
  dbGetToolCallCostByNameMock: vi.fn(),
  searchMock: vi.fn(),
  generateTextWithBillingMock: vi.fn(),
}));

vi.mock('@/env', () => ({
  env: {
    linkupApiKey: 'linkup-api-key',
  },
}));

vi.mock('linkup-sdk', () => ({
  LinkupClient: vi.fn(function LinkupClient(this: unknown) {
    return {
      search: mocks.searchMock,
    };
  }),
}));

vi.mock('@shared/db/functions/token-usage', () => ({
  dbInsertConversationToolCallUsage: mocks.dbInsertConversationToolCallUsageMock,
}));

vi.mock('@shared/db/functions/character', () => ({
  dbUpdateTokenUsageByCharacterChatId: mocks.dbUpdateTokenUsageByCharacterChatIdMock,
}));

vi.mock('@shared/db/functions/learning-scenario', () => ({
  dbUpdateTokenUsageBySharedLearningScenarioId:
    mocks.dbUpdateTokenUsageBySharedLearningScenarioIdMock,
}));

vi.mock('@shared/db/functions/tool-call', () => ({
  dbGetToolCallCostByName: mocks.dbGetToolCallCostByNameMock,
}));

vi.mock('@ais-chat/ai-core', () => ({
  generateTextWithBilling: mocks.generateTextWithBillingMock,
}));

describe('searchWeb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbGetToolCallCostByNameMock.mockResolvedValue({ costsInCent: 0.42 });
    mocks.searchMock.mockResolvedValue({
      results: [
        {
          name: 'Result',
          url: 'https://example.com',
          content: 'content',
        },
      ],
    });
  });

  it('records normal chat tool call usage in conversation usage tracking', async () => {
    const { searchWeb } = await import('./websearch');

    await searchWeb({
      query: 'aktuelles thema',
      conversationId: 'conversation-1',
      userId: 'user-1',
    });

    expect(mocks.dbInsertConversationToolCallUsageMock).toHaveBeenCalledWith({
      toolCallName: 'web_search',
      conversationId: 'conversation-1',
      userId: 'user-1',
      costsInCent: 0.42,
    });
    expect(mocks.dbUpdateTokenUsageByCharacterChatIdMock).not.toHaveBeenCalled();
    expect(mocks.dbUpdateTokenUsageBySharedLearningScenarioIdMock).not.toHaveBeenCalled();
  });

  it('prefers conversation usage tracking when conversationId is present', async () => {
    const { searchWeb } = await import('./websearch');

    await searchWeb({
      query: 'aktuelles thema',
      conversationId: 'conversation-1',
      userId: 'user-1',
      characterId: 'character-uuid',
      learningScenarioId: 'learning-scenario-uuid',
    });

    expect(mocks.dbInsertConversationToolCallUsageMock).toHaveBeenCalledWith({
      toolCallName: 'web_search',
      conversationId: 'conversation-1',
      userId: 'user-1',
      costsInCent: 0.42,
    });
    expect(mocks.dbUpdateTokenUsageByCharacterChatIdMock).not.toHaveBeenCalled();
    expect(mocks.dbUpdateTokenUsageBySharedLearningScenarioIdMock).not.toHaveBeenCalled();
  });

  it('records shared character tool call usage in shared character usage tracking', async () => {
    const { searchWeb } = await import('./websearch');

    await searchWeb({
      query: 'aktuelles thema',
      userId: 'user-1',
      characterId: 'character-uuid',
    });

    expect(mocks.dbUpdateTokenUsageByCharacterChatIdMock).toHaveBeenCalledWith({
      toolCallName: 'web_search',
      characterId: 'character-uuid',
      userId: 'user-1',
      costsInCent: 0.42,
      completionTokens: 0,
      promptTokens: 0,
      modelId: null,
    });
    expect(mocks.dbInsertConversationToolCallUsageMock).not.toHaveBeenCalled();
    expect(mocks.dbUpdateTokenUsageBySharedLearningScenarioIdMock).not.toHaveBeenCalled();
  });

  it('records shared learning scenario tool call usage in shared learning scenario usage tracking', async () => {
    const { searchWeb } = await import('./websearch');

    await searchWeb({
      query: 'aktuelles thema',
      userId: 'user-1',
      learningScenarioId: 'learning-scenario-uuid',
    });

    expect(mocks.dbUpdateTokenUsageBySharedLearningScenarioIdMock).toHaveBeenCalledWith({
      toolCallName: 'web_search',
      learningScenarioId: 'learning-scenario-uuid',
      userId: 'user-1',
      costsInCent: 0.42,
      completionTokens: 0,
      promptTokens: 0,
      modelId: null,
    });
    expect(mocks.dbInsertConversationToolCallUsageMock).not.toHaveBeenCalled();
    expect(mocks.dbUpdateTokenUsageByCharacterChatIdMock).not.toHaveBeenCalled();
  });
});
