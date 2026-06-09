import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileModelAndContent } from '@shared/db/schema';
import type { UserAndContext } from '@/auth/types';
import { VECTOR_SEARCH_LIMIT } from '@/configuration-text-inputs/const';

const mocks = vi.hoisted(() => ({
  isWebSearchEnabledMock: vi.fn(),
  searchWebMock: vi.fn(),
  retrieveChunksByQueryMock: vi.fn(),
}));

vi.mock('./websearch', () => ({
  isWebSearchEnabled: mocks.isWebSearchEnabledMock,
  searchWeb: mocks.searchWebMock,
}));

vi.mock('../rag/rag-service', () => ({
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
    expect(result).toContain('Dateien:');
    expect(result).toContain('Arbeitsblatt.pdf');
    expect(result).toContain('Leitfaden.txt');
    expect(result).toContain('Erster relevanter Abschnitt.');
  });
});
