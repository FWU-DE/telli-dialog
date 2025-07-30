import { parseHostname } from '@/utils/web-search/parsing';
import { WebsearchSource } from './types';

export const WEBSEARCH_PROMPT = `Der Nutzer hat folgende Quellen bereitgestellt, berücksichtige den Inhalt dieser Quellen bei der Antwort: `;

export function constructWebsearchPrompt({
  websearchSources,
}: {
  websearchSources?: WebsearchSource[];
}) {
  if (websearchSources === undefined || websearchSources.length === 0) {
    return '';
  }
  return `${WEBSEARCH_PROMPT} ${websearchSources.map((source) => constructSingleWebsearchPrompt(source)).join('\n')}`;
}

function constructSingleWebsearchPrompt(source: WebsearchSource) {
  const hostname = parseHostname(source.link);
  return `Titel der Website: ${hostname}\nInhalt: ${source.content}\n Titel der Seite: ${source.name}\n Quelle: ${source.link}`;
}
