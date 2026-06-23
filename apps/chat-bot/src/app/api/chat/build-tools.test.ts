import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileModelAndContent } from '@shared/db/schema';
import type { UserAndContext } from '@/auth/types';
import {
  RETRIEVE_ENTIRE_FILE_CHARACTER_LIMIT,
  VECTOR_SEARCH_LIMIT,
} from '@/configuration-text-inputs/const';

const mocks = vi.hoisted(() => ({
  isWebSearchEnabledMock: vi.fn(),
  searchWebMock: vi.fn(),
  ingestWebContentMock: vi.fn(),
  retrieveChunksByQueryMock: vi.fn(),
  webScraperMock: vi.fn(),
  dbGetExtractedFileContentMock: vi.fn(),
}));

vi.mock('./websearch', () => ({
  isWebSearchEnabled: mocks.isWebSearchEnabledMock,
  searchWeb: mocks.searchWebMock,
}));

vi.mock('../rag/ingestWebContent', () => ({
  ingestWebContent: mocks.ingestWebContentMock,
}));

vi.mock('../rag/rag-service', () => ({
  retrieveChunksByQuery: mocks.retrieveChunksByQueryMock,
}));

vi.mock('../web-scraper/web-scraper', () => ({
  webScraper: mocks.webScraperMock,
}));

vi.mock('@shared/db/functions/files', () => ({
  dbGetExtractedFileContent: mocks.dbGetExtractedFileContentMock,
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
    size: 120_000,
  },
  {
    id: 'file-2',
    name: 'Leitfaden.txt',
    size: 8_000,
  },
] as FileModelAndContent[];

const fileContentsById = new Map<string, string>([
  ['file-1', 'Erster Abschnitt. Zweiter Abschnitt. Dritter Abschnitt.'],
  ['file-2', 'Kurzer Leitfaden.'],
]);

beforeEach(() => {
  vi.clearAllMocks();
  for (const file of relatedFileEntities) {
    file.content = undefined;
  }
  mocks.isWebSearchEnabledMock.mockResolvedValue(false);
  mocks.searchWebMock.mockResolvedValue([]);
  mocks.dbGetExtractedFileContentMock.mockImplementation(async (fileId: string) => {
    return fileContentsById.get(fileId) ?? '';
  });
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
  mocks.ingestWebContentMock.mockResolvedValue({ processedUrls: [], errorUrls: [] });
  mocks.webScraperMock.mockResolvedValue({
    name: 'Beispielseite',
    link: 'https://example.com/article',
    content: 'Das ist der extrahierte Inhalt.',
  });
});

describe('buildTools', () => {
  it('adds a whole-file retrieval tool that returns the selected file content', async () => {
    const { buildTools } = await import('./build-tools');

    const { toolRegistry } = await buildTools({
      user,
      conversationId: 'conversation-1',
      relatedFileEntities,
    });

    expect(Object.keys(toolRegistry)).toContain('retrieve_entire_file');
    const retrieveEntireFileTool = toolRegistry.retrieve_entire_file!;

    expect(retrieveEntireFileTool.definition).toMatchObject({
      name: 'retrieve_entire_file',
    });
    expect(retrieveEntireFileTool.definition.description).toContain(
      'Arbeitsblatt.pdf (120000 bytes)',
    );
    expect(retrieveEntireFileTool.definition.description).toContain('Leitfaden.txt (8000 bytes)');
    expect(retrieveEntireFileTool.definition.parameters).toMatchObject({
      required: ['fileName'],
    });

    const result = await retrieveEntireFileTool.handler({
      fileName: 'Arbeitsblatt.pdf',
    });

    expect(mocks.dbGetExtractedFileContentMock).toHaveBeenCalledWith('file-1');
    expect(JSON.parse(result)).toEqual({
      fileName: 'Arbeitsblatt.pdf',
      content: 'Erster Abschnitt. Zweiter Abschnitt. Dritter Abschnitt.',
      truncated: false,
      characterCount: expect.any(Number),
      maxCharacters: RETRIEVE_ENTIRE_FILE_CHARACTER_LIMIT,
      error: null,
    });
  });

  it('caps whole-file retrieval at the configured character limit', async () => {
    const { buildTools } = await import('./build-tools');

    const veryLongFile = {
      id: 'file-3',
      name: 'Grossdatei.txt',
    } as FileModelAndContent;
    fileContentsById.set('file-3', 'a'.repeat(100_001));

    const { toolRegistry } = await buildTools({
      user,
      conversationId: 'conversation-1',
      relatedFileEntities: [veryLongFile],
    });

    const result = await toolRegistry.retrieve_entire_file!.handler({
      fileName: 'Grossdatei.txt',
    });

    const parsed = JSON.parse(result) as {
      truncated: boolean;
      maxCharacters: number;
      error: string | null;
      characterCount: number;
      content: string | null;
    };

    expect(parsed.truncated).toBe(true);
    expect(parsed.maxCharacters).toBe(RETRIEVE_ENTIRE_FILE_CHARACTER_LIMIT);
    expect(parsed.characterCount).toBeGreaterThan(RETRIEVE_ENTIRE_FILE_CHARACTER_LIMIT);
    expect(parsed.error).toContain('Zeichenlimits');
    expect(parsed.content).not.toBeNull();
  });

  it('adds a chunk retrieval tool that exposes file names and forwards the search query', async () => {
    const { buildTools } = await import('./build-tools');

    const { toolRegistry } = await buildTools({
      user,
      conversationId: 'conversation-1',
      relatedFileEntities,
      attachedLinks: [],
    });

    expect(Object.keys(toolRegistry)).toContain('retrieve_text_chunks');
    const retrieveTextChunksTool = toolRegistry.retrieve_text_chunks!;

    expect(retrieveTextChunksTool.definition).toMatchObject({
      name: 'retrieve_text_chunks',
    });
    expect(retrieveTextChunksTool.definition.description).toContain(
      'Arbeitsblatt.pdf (120000 bytes)',
    );
    expect(retrieveTextChunksTool.definition.description).toContain('Leitfaden.txt (8000 bytes)');
    expect(retrieveTextChunksTool.definition.parameters).toMatchObject({
      required: ['search', 'limit'],
      properties: {
        limit: {
          maximum: VECTOR_SEARCH_LIMIT,
        },
      },
    });

    const result = await retrieveTextChunksTool.handler({
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

  it('adds a chunk retrieval tool for linked pages and forwards source urls', async () => {
    mocks.ingestWebContentMock.mockResolvedValueOnce({
      processedUrls: ['https://example.com/shared-page'],
      errorUrls: [],
    });

    const { buildTools } = await import('./build-tools');

    const { toolRegistry } = await buildTools({
      user,
      conversationId: 'conversation-1',
      relatedFileEntities: [],
      sourceUrls: ['https://example.com/shared-page'],
    });

    expect(Object.keys(toolRegistry)).toContain('retrieve_text_chunks');
    const retrieveTextChunksTool = toolRegistry.retrieve_text_chunks!;

    expect(retrieveTextChunksTool.definition.description).toContain(
      'https://example.com/shared-page',
    );

    await retrieveTextChunksTool.handler({
      search: 'verlinkter Inhalt',
    });

    expect(mocks.retrieveChunksByQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: 'verlinkter Inhalt',
        federalStateId: 'federal-state-1',
        relatedFileEntities: [],
        sourceUrls: ['https://example.com/shared-page'],
      }),
    );
  });

  it('ingests linked pages before retrieving chunks', async () => {
    mocks.retrieveChunksByQueryMock.mockResolvedValueOnce([
      {
        id: 'chunk-2',
        content: 'Neu abgerufener Seitenabschnitt.',
        fileId: null,
        fileName: null,
        orderIndex: 0,
        sourceType: 'webpage',
        sourceUrl: 'https://example.com/shared-page',
      },
    ]);
    mocks.ingestWebContentMock.mockResolvedValueOnce({
      processedUrls: ['https://example.com/shared-page'],
      errorUrls: [],
    });

    const { buildTools } = await import('./build-tools');

    const { toolRegistry } = await buildTools({
      user,
      conversationId: 'conversation-1',
      relatedFileEntities: [],
      sourceUrls: ['https://example.com/shared-page'],
    });

    const result = await toolRegistry.retrieve_text_chunks!.handler({
      search: 'verlinkter Inhalt',
    });

    expect(mocks.ingestWebContentMock).toHaveBeenCalledWith({
      urls: ['https://example.com/shared-page'],
      federalStateId: 'federal-state-1',
    });
    expect(mocks.retrieveChunksByQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: 'verlinkter Inhalt',
        federalStateId: 'federal-state-1',
        relatedFileEntities: [],
        sourceUrls: ['https://example.com/shared-page'],
      }),
    );
    expect(JSON.parse(result)).toEqual({
      chunks: [
        {
          fileName: null,
          orderIndex: 0,
          content: 'Neu abgerufener Seitenabschnitt.',
        },
      ],
      error: null,
    });
  });

  it('adds a web scraper tool and returns scraped page content', async () => {
    mocks.isWebSearchEnabledMock.mockResolvedValue(true);
    const { buildTools } = await import('./build-tools');

    const { toolRegistry } = await buildTools({
      user,
      conversationId: 'conversation-1',
      relatedFileEntities: [],
      attachedLinks: [],
    });

    const webSearchTool = toolRegistry.web_search!;
    const webScraperTool = toolRegistry.web_scraper!;

    expect(Object.keys(toolRegistry).sort()).toEqual(['web_scraper', 'web_search']);
    expect(webSearchTool.definition).toMatchObject({
      name: 'web_search',
    });
    expect(webScraperTool.definition).toMatchObject({
      name: 'web_scraper',
    });
    expect(webScraperTool.definition.description).toContain('single webpage URL');
    expect(webScraperTool.definition.parameters).toMatchObject({
      required: ['url'],
      properties: {
        url: {
          type: 'string',
        },
      },
    });

    const result = await webScraperTool.handler({
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

    const { toolRegistry } = await buildTools({
      user,
      conversationId: 'conversation-1',
      relatedFileEntities: [],
      attachedLinks: [],
    });

    expect(Object.keys(toolRegistry).sort()).toEqual(['web_scraper', 'web_search']);

    const result = await toolRegistry.web_search!.handler({
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
