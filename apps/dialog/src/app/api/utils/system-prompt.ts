import { parseHostname } from '@/utils/web-search/parsing';
import { WebsearchSource } from '../conversation/tools/websearch/types';
import { ChunkResult } from '../file-operations/process-chunks';

export const LANGUAGE_GUIDLINES = `
## Sprachliche Richtlinien:
- Verwende eine Sprache, Tonalität und Inhalte, die für den Einsatz in der Schule geeignet sind.
- Vermeide komplizierte Fachbegriffe, es sei denn, sie sind notwendig und werden erklärt.
- Du sprichst immer die Sprache mit der du angesprochen wirst. 
- Du duzt dein Gegenüber, achte auf gendersensible Sprache. Verwende hierbei die Paarform (Beidnennung) z.B. Bürgerinnen und Bürger. 
`;

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

function formatTextChunk(textChunk: ChunkResult) {
  return textChunk.pageNumber
    ? `Seite ${textChunk.pageNumber}: ${textChunk.content}`
    : textChunk.content;
}

function constructSingleFilePrompt(textChunks: ChunkResult[]) {
  if (textChunks.length === 0) {
    return '';
  }

  return `${textChunks[0]?.fileName ? `Dateiname: ${textChunks[0].fileName}` : ''} 
Inhalt:
${textChunks.map(formatTextChunk).join('\n\n')}
`;
}

export function constructFileContentPrompt(
  retrievedTextChunks: Record<string, ChunkResult[]> | undefined,
) {
  return retrievedTextChunks !== undefined && Object.keys(retrievedTextChunks).length > 0
    ? `\nDer Nutzer hat folgende Dateien bereitgestellt, berücksichtige den Inhalt dieser Dateien bei der Antwort: ` +
        Object.keys(retrievedTextChunks).map((fileId) =>
          constructSingleFilePrompt(retrievedTextChunks?.[fileId] ?? []),
        )
    : '';
}
