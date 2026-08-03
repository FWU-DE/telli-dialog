import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mundoSearchMock: vi.fn(),
}));

vi.mock('../mundo-search', () => ({
  mundoSearch: mocks.mundoSearchMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildMundoSearchTool', () => {
  it('exposes a tool definition with a required query parameter', async () => {
    const { buildMundoSearchTool } = await import('./mundo-search-tool');
    const tool = buildMundoSearchTool();

    expect(tool.definition.name).toBe('mundo_search');
    expect(tool.definition.parameters).toMatchObject({
      required: ['query'],
    });
  });

  it('forwards the query to mundoSearch and returns results as JSON', async () => {
    mocks.mundoSearchMock.mockResolvedValueOnce([
      {
        title: 'Photosynthese',
        description: 'Video.',
        learnResourceType: ['VIDEO'],
        language: ['Deutsch'],
        url: 'https://mundo.schule/details/SODIX-1',
      },
    ]);

    const { buildMundoSearchTool } = await import('./mundo-search-tool');
    const tool = buildMundoSearchTool();

    const raw = await tool.handler({ query: 'Photosynthese' });

    expect(mocks.mundoSearchMock).toHaveBeenCalledWith({ query: 'Photosynthese' });
    expect(JSON.parse(raw)).toEqual({
      results: [
        {
          title: 'Photosynthese',
          description: 'Video.',
          learnResourceType: ['VIDEO'],
          language: ['Deutsch'],
          url: 'https://mundo.schule/details/SODIX-1',
        },
      ],
      error: null,
    });
  });

  it('returns an error when the query is empty and does not call mundoSearch', async () => {
    const { buildMundoSearchTool } = await import('./mundo-search-tool');
    const tool = buildMundoSearchTool();

    const raw = await tool.handler({ query: '   ' });

    expect(mocks.mundoSearchMock).not.toHaveBeenCalled();
    expect(JSON.parse(raw)).toEqual({
      results: [],
      error: 'Error: Missing search query.',
    });
  });

  it('returns a no-results error when mundoSearch returns an empty array', async () => {
    mocks.mundoSearchMock.mockResolvedValueOnce([]);

    const { buildMundoSearchTool } = await import('./mundo-search-tool');
    const tool = buildMundoSearchTool();

    const raw = await tool.handler({ query: 'test' });

    expect(JSON.parse(raw)).toEqual({
      results: [],
      error: 'No MUNDO results found.',
    });
  });
});
