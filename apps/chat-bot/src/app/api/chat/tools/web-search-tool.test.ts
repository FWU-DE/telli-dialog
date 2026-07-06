import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserAndContext } from '@/auth/types';

const mocks = vi.hoisted(() => ({
  isWebSearchEnabledMock: vi.fn(),
  searchWebMock: vi.fn(),
}));

vi.mock('../websearch', () => ({
  isWebSearchEnabled: mocks.isWebSearchEnabledMock,
  searchWeb: mocks.searchWebMock,
}));

const user = {
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
      isAgenticChatEnabled: true,
      isImageGenerationEnabled: true,
      isWebSearchEnabled: false,
    },
  },
} as UserAndContext;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isWebSearchEnabledMock.mockResolvedValue(false);
  mocks.searchWebMock.mockResolvedValue([]);
});

describe('buildWebSearchTool', () => {
  it('returns null when web search is disabled', async () => {
    mocks.isWebSearchEnabledMock.mockResolvedValue(false);
    const { buildWebSearchTool } = await import('./web-search-tool');

    const result = await buildWebSearchTool({
      user,
      conversationId: 'conversation-1',
      webSearchResults: [],
    });

    expect(result).toBeNull();
  });

  it('adds a web search tool and returns search results as JSON', async () => {
    mocks.isWebSearchEnabledMock.mockResolvedValue(true);
    mocks.searchWebMock.mockResolvedValue([
      {
        name: 'Beispielartikel',
        url: 'https://example.com/search-result',
        content: 'Kurzer Auszug aus dem Suchergebnis.',
      },
    ]);

    const { buildWebSearchTool } = await import('./web-search-tool');

    const webSearchResults: any[] = [];
    const tool = await buildWebSearchTool({
      user,
      conversationId: 'conversation-1',
      webSearchResults,
    });

    expect(tool).not.toBeNull();
    expect(tool!.definition).toMatchObject({
      name: 'web_search',
    });
    expect(tool!.definition.parameters).toMatchObject({
      required: ['query'],
    });

    const result = await tool!.handler({
      query: 'aktuelle information',
    });

    expect(mocks.searchWebMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'aktuelle information',
        conversationId: 'conversation-1',
        userId: 'user-1',
      }),
    );
    expect(JSON.parse(result)).toEqual({
      results: [
        {
          title: 'Beispielartikel',
          url: 'https://example.com/search-result',
          content: 'Kurzer Auszug aus dem Suchergebnis.',
        },
      ],
      error: null,
    });
    expect(webSearchResults).toHaveLength(1);
  });

  it('calls onWebSearchResults callback when provided', async () => {
    mocks.isWebSearchEnabledMock.mockResolvedValue(true);
    mocks.searchWebMock.mockResolvedValue([
      {
        name: 'Test',
        url: 'https://example.com',
        content: 'Content',
      },
    ]);

    const { buildWebSearchTool } = await import('./web-search-tool');

    const onWebSearchResults = vi.fn();
    const tool = await buildWebSearchTool({
      user,
      conversationId: 'conversation-1',
      webSearchResults: [],
      onWebSearchResults,
    });

    await tool!.handler({ query: 'test' });

    expect(onWebSearchResults).toHaveBeenCalledWith([
      {
        name: 'Test',
        url: 'https://example.com',
        content: 'Content',
      },
    ]);
  });
});
