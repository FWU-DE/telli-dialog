import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileModelAndContent } from '@shared/db/schema';
import type { UserAndContext } from '@/auth/types';
import { VECTOR_SEARCH_LIMIT } from '@/configuration-text-inputs/const';

const mocks = vi.hoisted(() => ({
  isWebSearchEnabledMock: vi.fn(),
  searchWebMock: vi.fn(),
  retrieveChunksByQueryMock: vi.fn(),
  webScraperMock: vi.fn(),
}));

vi.mock('./websearch', () => ({
  isWebSearchEnabled: mocks.isWebSearchEnabledMock,
  searchWeb: mocks.searchWebMock,
}));

vi.mock('../rag/rag-service', () => ({
  retrieveChunksByQuery: mocks.retrieveChunksByQueryMock,
}));

vi.mock('../web-scraper/web-scraper', () => ({
  webScraper: mocks.webScraperMock,
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

const relatedFileEntities = [
  {
    id: 'file-1',
    name: 'Arbeitsblatt.pdf',
  },
  {
    id: 'file-2',
    name: 'Leitfaden.txt',
  },
] as FileModelAndContent[];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isWebSearchEnabledMock.mockResolvedValue(false);
  mocks.searchWebMock.mockResolvedValue([]);
  mocks.retrieveChunksByQueryMock.mockResolvedValue([
    {
      id: 'chunk-1',
      content: 'Erster relevanter Abschnitt.',
      fileId: 'file-1',
      fileName: 'Arbeitsblatt.pdf',
      orderIndex: 0,
      sourceType: 'file',
      sourceUrl: null,
    },
  ]);
  mocks.webScraperMock.mockResolvedValue({
    name: 'Beispielseite',
    link: 'https://example.com/article',
    content: 'Das ist der extrahierte Inhalt.',
  });
});

describe('buildTools', () => {
  it('adds a chunk retrieval tool that exposes file names and forwards the search query', async () => {
    const { buildTools } = await import('./build-tools');

    const { tools, toolHandlers } = await buildTools({
      user,
      conversationId: 'conversation-1',
      relatedFileEntities,
    });

    expect(tools).toHaveLength(1);
    expect(tools[0]).toMatchObject({
      name: 'retrieve_text_chunks',
    });
    expect(tools[0]?.description).toContain('Arbeitsblatt.pdf');
    expect(tools[0]?.description).toContain('Leitfaden.txt');
    expect(tools[0]?.parameters).toMatchObject({
      required: ['search'],
      properties: {
        limit: {
          maximum: VECTOR_SEARCH_LIMIT,
        },
      },
    });

    const result = await toolHandlers.retrieve_text_chunks!({
      search: 'relevante Passage',
      limit: VECTOR_SEARCH_LIMIT + 5,
    });

    expect(mocks.retrieveChunksByQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: 'relevante Passage',
        federalStateId: 'federal-state-1',
        relatedFileEntities,
        limit: VECTOR_SEARCH_LIMIT,
      }),
    );
    expect(JSON.parse(result)).toEqual({
      chunks: [
        {
          fileName: 'Arbeitsblatt.pdf',
          orderIndex: 0,
          content: 'Erster relevanter Abschnitt.',
        },
      ],
      error: null,
    });
  });

  it('adds a web scraper tool and returns scraped page content', async () => {
    mocks.isWebSearchEnabledMock.mockResolvedValue(true);
    const { buildTools } = await import('./build-tools');

    const { tools, toolHandlers } = await buildTools({
      user,
      conversationId: 'conversation-1',
      relatedFileEntities: [],
    });

    const webSearchTool = tools.find((tool) => tool.name === 'web_search');
    const webScraperTool = tools.find((tool) => tool.name === 'web_scraper');

    expect(webSearchTool).toMatchObject({
      name: 'web_search',
    });
    expect(webScraperTool).toMatchObject({
      name: 'web_scraper',
    });
    expect(webScraperTool?.description).toContain('single webpage URL');
    expect(webScraperTool?.parameters).toMatchObject({
      required: ['url'],
      properties: {
        url: {
          type: 'string',
        },
      },
    });

    const result = await toolHandlers.web_scraper!({
      url: 'https://example.com/article',
    });

    expect(mocks.webScraperMock).toHaveBeenCalledWith('https://example.com/article');
    expect(JSON.parse(result)).toEqual({
      title: 'Beispielseite',
      url: 'https://example.com/article',
      content: 'Das ist der extrahierte Inhalt.',
      error: null,
    });
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

    const { buildTools } = await import('./build-tools');

    const { toolHandlers } = await buildTools({
      user,
      conversationId: 'conversation-1',
      relatedFileEntities: [],
    });

    const result = await toolHandlers.web_search!({
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
  });
});
