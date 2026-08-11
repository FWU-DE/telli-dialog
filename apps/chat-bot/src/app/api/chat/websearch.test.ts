import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserAndContext } from '@/auth/types';

const mocks = vi.hoisted(() => ({
  dbGetAssistantByIdMock: vi.fn(),
  dbGetCharacterByIdMock: vi.fn(),
  dbGetLearningScenarioByIdMock: vi.fn(),
  dbInsertConversationToolCallUsageMock: vi.fn(),
  dbUpdateTokenUsageByCharacterChatIdMock: vi.fn(),
  dbUpdateTokenUsageBySharedLearningScenarioIdMock: vi.fn(),
  dbGetToolCallCostByNameMock: vi.fn(),
  searchMock: vi.fn(),
  generateTextWithBillingMock: vi.fn(),
}));

vi.mock('./env', () => ({
  env: {
    linkupApiKey: 'linkup-api-key',
  },
}));

vi.mock('@shared/db/functions/assistants', () => ({
  dbGetAssistantById: mocks.dbGetAssistantByIdMock,
}));

vi.mock('@shared/db/functions/character', () => ({
  dbGetCharacterById: mocks.dbGetCharacterByIdMock,
  dbUpdateTokenUsageByCharacterChatId: mocks.dbUpdateTokenUsageByCharacterChatIdMock,
}));

vi.mock('@shared/db/functions/learning-scenario', () => ({
  dbGetLearningScenarioById: mocks.dbGetLearningScenarioByIdMock,
  dbUpdateTokenUsageBySharedLearningScenarioId:
    mocks.dbUpdateTokenUsageBySharedLearningScenarioIdMock,
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

  it('forwards includeDomains to the Linkup client when includedDomains is non-empty', async () => {
    const { searchWeb } = await import('./websearch');

    await searchWeb({
      query: 'aktuelles thema',
      conversationId: 'conversation-1',
      userId: 'user-1',
      includedDomains: ['example.com', 'foo.de'],
    });

    expect(mocks.searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        includeDomains: ['example.com', 'foo.de'],
      }),
    );
  });

  it('does not forward includeDomains when includedDomains is undefined', async () => {
    const { searchWeb } = await import('./websearch');

    await searchWeb({
      query: 'aktuelles thema',
      conversationId: 'conversation-1',
      userId: 'user-1',
    });

    expect(mocks.searchMock).toHaveBeenCalledTimes(1);
    expect(mocks.searchMock.mock.calls[0]![0]).not.toHaveProperty('includeDomains');
  });

  it('does not forward includeDomains when includedDomains is empty', async () => {
    const { searchWeb } = await import('./websearch');

    await searchWeb({
      query: 'aktuelles thema',
      conversationId: 'conversation-1',
      userId: 'user-1',
      includedDomains: [],
    });

    expect(mocks.searchMock).toHaveBeenCalledTimes(1);
    expect(mocks.searchMock.mock.calls[0]![0]).not.toHaveProperty('includeDomains');
  });
});

describe('resolveWebSearchConfig', () => {
  const user = {
    federalState: {
      featureToggles: { isWebSearchEnabled: true },
    },
  } as unknown as UserAndContext;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('trims and drops empty domain entries from a character', async () => {
    mocks.dbGetCharacterByIdMock.mockResolvedValue({
      isWebSearchEnabled: true,
      webSearchScope: 'included-domains',
      webSearchIncludedDomains: ['  example.com  ', '', '   ', 'foo.de'],
    });

    const { resolveWebSearchConfig } = await import('./websearch');

    const config = await resolveWebSearchConfig({
      user,
      characterId: 'character-uuid',
    });

    expect(config).toEqual({
      enabled: true,
      scope: 'included-domains',
      includedDomains: ['example.com', 'foo.de'],
    });
  });

  it('trims and drops empty domain entries from a learning scenario', async () => {
    mocks.dbGetLearningScenarioByIdMock.mockResolvedValue({
      isWebSearchEnabled: true,
      webSearchScope: 'included-domains',
      webSearchIncludedDomains: ['  example.com  ', '', '   ', 'foo.de'],
    });

    const { resolveWebSearchConfig } = await import('./websearch');

    const config = await resolveWebSearchConfig({
      user,
      learningScenarioId: 'learning-scenario-uuid',
    });

    expect(config).toEqual({
      enabled: true,
      scope: 'included-domains',
      includedDomains: ['example.com', 'foo.de'],
    });
  });

  it('returns disabled config when assistant web search is disabled', async () => {
    mocks.dbGetAssistantByIdMock.mockResolvedValue({
      isWebSearchEnabled: false,
      webSearchScope: 'included-domains',
      webSearchIncludedDomains: ['example.com'],
    });

    const { resolveWebSearchConfig } = await import('./websearch');

    const config = await resolveWebSearchConfig({
      user,
      assistantId: 'assistant-uuid',
    });

    expect(config).toEqual({
      enabled: false,
      scope: 'all-web',
      includedDomains: [],
    });
  });

  it('trims and drops empty domain entries from an assistant', async () => {
    mocks.dbGetAssistantByIdMock.mockResolvedValue({
      isWebSearchEnabled: true,
      webSearchScope: 'included-domains',
      webSearchIncludedDomains: ['  example.com  ', '', '   ', 'foo.de'],
    });

    const { resolveWebSearchConfig } = await import('./websearch');

    const config = await resolveWebSearchConfig({
      user,
      assistantId: 'assistant-uuid',
    });

    expect(config).toEqual({
      enabled: true,
      scope: 'included-domains',
      includedDomains: ['example.com', 'foo.de'],
    });
  });
});

describe('isWebSearchEnabledForEntity', () => {
  it('returns true when federal-state toggle and entity setting are both true', async () => {
    const { isWebSearchEnabledForEntity } = await import('./websearch');

    const result = isWebSearchEnabledForEntity({
      featureToggles: { isWebSearchEnabled: true },
      entity: { isWebSearchEnabled: true },
    });

    expect(result).toBe(true);
  });

  it('returns false when federal-state toggle is false', async () => {
    const { isWebSearchEnabledForEntity } = await import('./websearch');

    const result = isWebSearchEnabledForEntity({
      featureToggles: { isWebSearchEnabled: false },
      entity: { isWebSearchEnabled: true },
    });

    expect(result).toBe(false);
  });

  it('returns false when federal-state toggle is missing', async () => {
    const { isWebSearchEnabledForEntity } = await import('./websearch');

    const result = isWebSearchEnabledForEntity({
      featureToggles: {},
      entity: { isWebSearchEnabled: true },
    });

    expect(result).toBe(false);
  });

  it('returns false when entity setting is false', async () => {
    const { isWebSearchEnabledForEntity } = await import('./websearch');

    const result = isWebSearchEnabledForEntity({
      featureToggles: { isWebSearchEnabled: true },
      entity: { isWebSearchEnabled: false },
    });

    expect(result).toBe(false);
  });
});
