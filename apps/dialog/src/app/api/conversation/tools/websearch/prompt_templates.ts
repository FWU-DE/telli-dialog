import { parseHostname } from '@/utils/web-search/parsing';
import { WebsearchSource } from './types';

export function constructWebsearchPrompt(websearchSources?: WebsearchSource[]) {
  if (websearchSources === undefined || websearchSources.length === 0) {
    return '';
  }
  return `
Der Nutzer hat folgende Quellen bereitgestellt, berücksichtige den Inhalt dieser Quellen bei der Antwort:
${websearchSources.map((source) => constructSingleWebsearchPrompt(source)).join('\n')}`;
}

function constructSingleWebsearchPrompt(source: WebsearchSource) {
  const hostname = parseHostname(source.link);
  return `Titel der Website: ${hostname}
Inhalt: ${source.content}
Titel der Seite: ${source.name}
Quelle: ${source.link}
`;
}
