import { MUNDO_SEARCH_QUERY_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { mundoSearch, type MundoSearchResult } from '../mundo-search';
import type { ToolDefinition, ToolRegistration } from './types';

type MundoSearchToolResponse = {
  results: MundoSearchResult[];
  error: string | null;
};

export function buildMundoSearchTool(): ToolRegistration {
  const definition: ToolDefinition = {
    name: 'mundo_search',
    description:
      'Search the public MUNDO educational media library (mundo.schule) for teaching materials such as videos, worksheets, and interactive content. Use this tool when the user (typically a teacher) asks for lesson materials or media suggestions for a specific topic. Returns up to 10 matching MUNDO media entries with title, description, learn resource type, language, and a direct URL to the MUNDO detail page.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'A concise search query in German describing the topic (max 3 words). Examples: "Photosynthese", "Bruchrechnung", "Weimarer Republik".',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  };

  const handler = async (args: Record<string, unknown>): Promise<string> => {
    const rawQuery = typeof args.query === 'string' ? args.query.trim() : '';
    const query = rawQuery.slice(0, MUNDO_SEARCH_QUERY_LENGTH_LIMIT);

    if (query.length === 0) {
      const response: MundoSearchToolResponse = {
        results: [],
        error: 'Error: Missing search query.',
      };
      return JSON.stringify(response);
    }

    const results = await mundoSearch({ query });

    const response: MundoSearchToolResponse = {
      results,
      error: results.length === 0 ? 'No MUNDO results found.' : null,
    };

    return JSON.stringify(response);
  };

  return { definition, handler };
}
