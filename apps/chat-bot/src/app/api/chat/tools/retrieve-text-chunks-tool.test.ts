import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileModel } from '@shared/db/schema';
import type { UserAndContext } from '@/auth/types';
import { VECTOR_SEARCH_LIMIT } from '@/configuration-text-inputs/const';

const mocks = vi.hoisted(() => ({
  ingestWebContentMock: vi.fn(),
  retrieveChunksByQueryMock: vi.fn(),
}));

vi.mock('../../rag/ingestWebContent', () => ({
  ingestWebContent: mocks.ingestWebContentMock,
}));

vi.mock('../../rag/rag-service', () => ({
  retrieveChunksByQuery: mocks.retrieveChunksByQueryMock,
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
] as FileModel[];

beforeEach(() => {
  vi.clearAllMocks();
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
});

describe('buildRetrieveTextChunksTool', () => {
  it('returns null when no files and no source URLs', async () => {
    const { buildRetrieveTextChunksTool } = await import('./retrieve-text-chunks-tool');

    const result = buildRetrieveTextChunksTool({
      user,
      relatedFileEntities: [],
      sourceUrls: [],
      attachedLinks: [],
    });

    expect(result).toBeNull();
  });

  it('adds a chunk retrieval tool that exposes file names and forwards the search query', async () => {
    const { buildRetrieveTextChunksTool } = await import('./retrieve-text-chunks-tool');

    const tool = buildRetrieveTextChunksTool({
      user,
      relatedFileEntities,
      sourceUrls: [],
      attachedLinks: [],
    });

    expect(tool).not.toBeNull();
    expect(tool!.definition).toMatchObject({
      name: 'retrieve_text_chunks',
    });
    expect(tool!.definition.description).toContain('Arbeitsblatt.pdf (120000 bytes)');
    expect(tool!.definition.description).toContain('Leitfaden.txt (8000 bytes)');
    expect(tool!.definition.parameters).toMatchObject({
      required: ['search'],
      properties: {
        search: {
          type: 'string',
        },
      },
    });

    const result = await tool!.handler({
      search: 'relevante Passage',
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

    const { buildRetrieveTextChunksTool } = await import('./retrieve-text-chunks-tool');

    const tool = buildRetrieveTextChunksTool({
      user,
      relatedFileEntities: [],
      sourceUrls: ['https://example.com/shared-page'],
      attachedLinks: [],
    });

    expect(tool).not.toBeNull();
    expect(tool!.definition.description).toContain('https://example.com/shared-page');

    await tool!.handler({
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

    const { buildRetrieveTextChunksTool } = await import('./retrieve-text-chunks-tool');

    const tool = buildRetrieveTextChunksTool({
      user,
      relatedFileEntities: [],
      sourceUrls: ['https://example.com/shared-page'],
      attachedLinks: [],
    });

    const result = await tool!.handler({
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

  it('returns error when no chunks found', async () => {
    mocks.retrieveChunksByQueryMock.mockResolvedValueOnce([]);

    const { buildRetrieveTextChunksTool } = await import('./retrieve-text-chunks-tool');

    const tool = buildRetrieveTextChunksTool({
      user,
      relatedFileEntities,
      sourceUrls: [],
      attachedLinks: [],
    });

    const result = await tool!.handler({
      search: 'not found',
    });

    const parsed = JSON.parse(result);
    expect(parsed.chunks).toEqual([]);
    expect(parsed.error).toBe('No matching chunks found.');
  });
});
