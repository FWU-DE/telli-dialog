import { tool } from 'ai';
import { constructBraveSummarySearchExec } from './search-web';
import { websearchToolArgsSchema, WebsearchToolResult } from './types';

/**
 * NOT YET IN USE ---
 * Constructs a web search tool for the given GPT name.
 * @param gptName The name of the GPT to use for the web search.
 * @returns A web search tool.
 */
export function constructWebSearchTool(gptName: string) {
  return tool({
    description: `${gptName} nutzt die Internetsuche für aktuelle, standortbezogene oder besonders detaillierte Fragen. Beispiele:
- Lokale Infos wie Wetter, Veranstaltungen oder Geschäfte
- Themen mit potenziell veralteten Modellinformationen
- Nischenwissen (z.B. kleine Firmen, spezielle Regeln)
- Hohe Genauigkeit erforderlich (z.B. Software-Versionen, Spieltermine)`,
    parameters: websearchToolArgsSchema,
    execute: async ({ search_query }): Promise<WebsearchToolResult> => {
      const searchTool = constructBraveSummarySearchExec({ nofSources: 8, gptName });
      const result = await searchTool({ searchQuery: search_query });
      return { type: 'websearch', state: 'success', ...result };
    },
  });
}
