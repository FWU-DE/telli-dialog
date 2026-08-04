import {
  MUNDO_SEARCH_QUERY_LENGTH_LIMIT,
  MUNDO_SEARCH_RESULTS_LIMIT,
} from '@/configuration-text-inputs/const';
import { mundoSearch, MUNDO_CLASS_LEVELS, type MundoSearchResult } from '../mundo-search';
import type { ToolDefinition, ToolRegistration } from './types';

type MundoSearchToolResponse = {
  results: MundoSearchResult[];
  filtersDropped: boolean;
  error: string | null;
};

export function buildMundoSearchTool(): ToolRegistration {
  const definition: ToolDefinition = {
    name: 'mundo_search',
    description: `Search the public MUNDO educational media library (mundo.schule) for teaching materials, e.g. videos or worksheets. Use this tool when the user asks for lesson materials or media suggestions for a specific topic. Returns up to ${MUNDO_SEARCH_RESULTS_LIMIT} matching MUNDO media entries. If a search with filters returns nothing, filters are automatically dropped and the search is retried once; when the response has "filtersDropped": true, do not retry with different filters — instead retry with a broader, simpler or alternative query.`,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'A concise search query in German describing the topic (max 2 words). Examples: "Photosynthese", "Bruchrechnung", "Weimarer Republik".',
        },
        classLevel: {
          type: 'string',
          description:
            'Optional class level range to filter results by. Only set this when the teacher explicitly mentioned the class or grade the lesson is intended for; then pick the single range that best matches. If the teacher did not specify a target class or grade, omit this parameter so no filter is applied.',
          enum: [...MUNDO_CLASS_LEVELS],
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
        filtersDropped: false,
        error: 'Error: Missing search query.',
      };
      return JSON.stringify(response);
    }

    const classLevel = typeof args.classLevel === 'string' ? args.classLevel : undefined;
    const hasFilters = classLevel !== undefined;

    let results = await mundoSearch({ query, classLevel });
    let filtersDropped = false;

    if (results.length === 0 && hasFilters) {
      results = await mundoSearch({ query });
      filtersDropped = true;
    }

    const response: MundoSearchToolResponse = {
      results,
      filtersDropped,
      error: results.length === 0 ? 'No MUNDO results found.' : null,
    };

    return JSON.stringify(response);
  };

  return { definition, handler };
}
