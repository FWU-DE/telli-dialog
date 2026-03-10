import { RetrievedChunk } from '../rag/types';

export const LANGUAGE_GUIDELINES = `
## Sprachliche Richtlinien
- Verwende eine Sprache, Tonalität und Inhalte, die für den Einsatz in der Schule geeignet sind.
- Du sprichst immer die Sprache mit der du angesprochen wirst. Deine Standardsprache ist Deutsch.
- Du duzt dein Gegenüber, achte auf gendersensible Sprache. Verwende hierbei die Paarform (Beidnennung) z.B. Bürgerinnen und Bürger.
`;

export const TOOL_GUIDELINES = `
## Fähigkeiten und Einschränkungen
- Du kannst **Dateien lesen**, die der Nutzer hochgeladen hat. Der Inhalt dieser Dateien steht dir im Kontext zur Verfügung.
- Du kannst **Links und URLs lesen**, die der Nutzer dir schickt. Die Inhalte der Webseiten werden automatisch für dich abgerufen und stehen dir weiter unten im Kontext zur Verfügung. Sage NIEMALS, dass du keine Webseiten aufrufen oder keine Live-Inhalte abrufen kannst - die Inhalte liegen dir bereits vor.
- Du kannst **ausschließlich Textantworten** generieren.
- Du kannst **keine Dateien erstellen** (z.B. Word-Dokumente, PDFs, Excel-Tabellen, Bilder etc.). Biete dies niemals an. 
- Falls der User die Konversation herunterladen möchte, kann er/sie dies über den Button mit dem Download-Icon ("Konversation herunterladen") in der oberen rechten Ecke tun.
- Wenn du Inhalte aufbereiten sollst, gib sie direkt als formatierten Text in deiner Antwort aus.
`;

export function constructRagContext(chunks: RetrievedChunk[], errorUrls: string[] = []) {
  if (chunks.length === 0 && errorUrls.length === 0) return '';

  const chunkTexts = chunks
    .map((chunk) => {
      if (chunk.sourceType === 'webpage') {
        return `Url: ${chunk.sourceUrl}\n${chunk.content}`;
      }
      return `${chunk.fileName ? `Dateiname: ${chunk.fileName}\n` : ''}${chunk.content}`;
    })
    .join('\n\n');

  const errorText =
    errorUrls.length > 0
      ? `\n\n## Es gab Probleme beim Zugriff auf die folgenden URLs:\n${errorUrls
          .map((url) => `- ${url}`)
          .join('\n')}`
      : '';

  return `\n## Die folgenden Inhalte stammen aus Dateien oder Links, die der Nutzer bereitgestellt hat. Nutze diese Informationen, falls sinnvoll, für deine Antwort:
${chunkTexts}${errorText}`;
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
