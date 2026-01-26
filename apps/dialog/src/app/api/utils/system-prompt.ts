import { TOTAL_WEBSEARCH_CONTENT_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { WebsearchSource } from '../webpage-content/types';
import { ChunkResult } from '../file-operations/process-chunks';

export const LANGUAGE_GUIDELINES = `
## Sprachliche Richtlinien
- Verwende eine Sprache, Tonalität und Inhalte, die für den Einsatz in der Schule geeignet sind.
- Du sprichst immer die Sprache mit der du angesprochen wirst. Deine Standardsprache ist Deutsch.
- Du duzt dein Gegenüber, achte auf gendersensible Sprache. Verwende hierbei die Paarform (Beidnennung) z.B. Bürgerinnen und Bürger.
`;

export function constructWebsearchPrompt(websearchSources?: WebsearchSource[]) {
  if (websearchSources === undefined || websearchSources.length === 0) {
    return '';
  }

  const promptParts = websearchSources.map((source) => constructSingleWebsearchPrompt(source));
  const fullPrompt = `
## Der Nutzer hat folgende Quellen bereitgestellt, berücksichtige den Inhalt dieser Quellen bei der Antwort:
${promptParts.join('\n')}`;

  if (fullPrompt.length > TOTAL_WEBSEARCH_CONTENT_LENGTH_LIMIT) {
    return (
      fullPrompt.substring(0, TOTAL_WEBSEARCH_CONTENT_LENGTH_LIMIT) +
      '\n\n[Weitere Quellen gekürzt aufgrund der Längenbegrenzung]'
    );
  }

  return fullPrompt;
}

function constructSingleWebsearchPrompt(source: WebsearchSource) {
  if (source.error || !source.content) {
    return `Quelle: ${source.link}
Inhalt: [Fehler - Der Inhalt dieser Webseite konnte nicht extrahiert werden]
`;
  }

  return `Quelle: ${source.link}
Inhalt: ${source.content}
`;
}

function constructSingleFilePrompt(textChunks: ChunkResult[]) {
  if (textChunks.length === 0) {
    return '';
  }

  return `${textChunks[0]?.fileName ? `Dateiname: ${textChunks[0].fileName}` : ''} 
Inhalt:
${textChunks.map((chunk) => chunk.content).join('\n\n')}
`;
}

export function constructFilePrompt(
  retrievedTextChunks: Record<string, ChunkResult[]> | undefined,
) {
  return retrievedTextChunks !== undefined && Object.keys(retrievedTextChunks).length > 0
    ? `\n## Der Nutzer hat folgende Dateien bereitgestellt, berücksichtige den Inhalt dieser Dateien bei der Antwort:\n` +
        Object.entries(retrievedTextChunks)
          .map(([, textChunks]) => constructSingleFilePrompt(textChunks))
          .join('\n')
    : '';
}

// Helper to format optional fields in a list
// Takes a title and an array of objects with label and value, filters out undefined or null values, and formats them as a list
export function formatList(
  title: string,
  fields: Array<{ label: string; value: string | undefined | null }>,
) {
  const filteredFields = fields.filter(
    (f) => f.value !== undefined && f.value !== null && f.value.length !== 0,
  );

  if (filteredFields.length === 0) {
    return '';
  }

  const formattedList = filteredFields.map((f) => `- **${f.label}**: ${f.value}`).join('\n');

  return `${title}\n${formattedList}`;
}
