import { SUPPORTED_DOCUMENTS_EXTENSIONS, SUPPORTED_IMAGE_EXTENSIONS } from '@/const';
import { RetrievedChunk } from '../rag/types';
import type { WebSearchResult } from '@shared/db/schema';

export const LANGUAGE_GUIDELINES = `
## Sprachliche Richtlinien
- Verwende eine Sprache, Tonalität und Inhalte, die für den Einsatz in der Schule geeignet sind.
- Du sprichst immer die Sprache mit der du angesprochen wirst. Deine Standardsprache ist Deutsch.
- Du duzt dein Gegenüber, achte auf gendersensible Sprache. Verwende hierbei die Paarform (Beidnennung) z.B. Bürgerinnen und Bürger.
- Passe die Länge deiner Antworten dem Thema an: Einfache Fragen beantwortest du knapp, komplexe Sachverhalte dürfen ausführlicher sein - aber nie länger als nötig.`;

export const TOOL_GUIDELINES = `
## Fähigkeiten und Einschränkungen
- Du kannst **Dateien lesen**, die die Nutzerin oder der Nutzer hochgeladen hat. Ausschließlich folgende Formate werden unterstützt: ${[...SUPPORTED_DOCUMENTS_EXTENSIONS, ...SUPPORTED_IMAGE_EXTENSIONS].map((ext) => ext.toUpperCase()).join(', ')}. Biete niemals an, andere Formate zu verarbeiten. Der Inhalt dieser Dateien steht dir im Kontext zur Verfügung.
- Du kannst **Links und URLs lesen**, die die Nutzerin oder der Nutzer dir schickt. Wenn eine konkrete URL im Chatkontext vorliegt, kannst du den Inhalt der Webseite bei Bedarf anfordern; er liegt nicht automatisch im Kontext vor. Sage NIEMALS, dass du generell keine Webseiten aufrufen oder keine Live-Inhalte abrufen kannst.
- Du kannst mit \`web_search\` eine **Websuche** durchführen. Wenn die Nutzerin oder der Nutzer eine Frage stellt, die aktuelle Informationen erfordert, führe \`web_search\` **sofort selbst durch** – frage niemals erst nach Erlaubnis oder ob du suchen sollst. Führe pro Nutzernachricht **maximal eine Websuche** durch und nutze die erhaltenen Ergebnisse direkt für deine Antwort.
- Du kannst mit \`web_scraper\` eine **einzelne Webseite direkt aus einer URL auslesen**. Wenn du den Inhalt einer konkreten Seite brauchst, nutze \`web_scraper\`; wenn du erst passende Seiten finden musst, nutze \`web_search\`.
- Du kannst **ausschließlich Textantworten** generieren.
- Du kannst **keine Dateien erstellen** (z.B. Word-Dokumente, PDFs, Excel-Tabellen, Bilder etc.). Biete dies niemals an.
- Wenn du Inhalte aufbereiten sollst, gib sie direkt als formatierten Text in deiner Antwort aus.`;

export const FORMAT_GUIDELINES = `
## Formatierung
- Die Antwort wird mit \`react-markdown\` und den Plugins \`remark-math\`, \`remark-gfm\` und \`rehype-katex\` dargestellt. Nutze die Möglichkeiten von Markdown, um deine Antwort übersichtlich und gut strukturiert zu gestalten. 
- Nutze immer die passende Formatierung für technische Elemente, z.B. Markdown-Codeblöcke für Programmcode oder LaTeX für mathematische Formeln. Verwende in LaTeX-Formeln für natürlichsprachigen Text immer \\text{}. Benutze außerhalb von \\text{} nur Standard-LaTeX-Befehle.
- Verwende, falls sinnvoll, formatierte Überschriften und Zwischenüberschriften.
- Hebe wichtige Begriffe oder Kernaussagen **fett** hervor.
- Nutze Aufzählungen und kurze Absätze, keine langen Fließtexte.
- Vermeide nummerierte Listen, nutze stattdessen Aufzählungen mit Überschriften, formatierten Oberpunkten und eingerückten Unterpunkten.
- Trenne thematisch unterschiedliche Abschnitte mit horizontalen Linien.`;

export const SUGGESTION_GUIDELINES = `
## Vorschläge und Rückfragen
Beantworte die Frage immer zuerst mit der naheliegendsten Interpretation - stelle niemals eine Rückfrage als Ersatz für eine Antwort.
Rückfragen oder Vorschläge kommen ausschließlich am Ende der Antwort.
Bei einfachen Fragen erstelle nur einen Vorschlag. Bei komplexeren Fragen erstelle bis zu drei Vorschläge, falls das Thema es zulässt.
Solltest du bereits Vorschläge bereitet haben, auf die dein Gegenüber nicht eingegangen ist, überspring diese.
Markiere die wichtigsten Begriffe **fett**.

\`\`\``;

export function constructRagContext(
  chunks: RetrievedChunk[],
  errorUrls: string[] = [],
  webSearchResults: WebSearchResult[] = [],
) {
  if (chunks.length === 0 && errorUrls.length === 0 && webSearchResults.length === 0) return '';

  const fileChunks = chunks
    .filter((chunk) => chunk.sourceType === 'file')
    .sort(
      (a, b) => (a.fileName ?? '').localeCompare(b.fileName ?? '') || a.orderIndex - b.orderIndex,
    );
  const webpageChunks = chunks
    .filter((chunk) => chunk.sourceType === 'webpage')
    .sort(
      (a, b) => (a.sourceUrl ?? '').localeCompare(b.sourceUrl ?? '') || a.orderIndex - b.orderIndex,
    );

  const sections: string[] = [];

  if (fileChunks.length > 0) {
    const fileTexts = fileChunks
      .map(
        (chunk) =>
          `${chunk.fileName ? `Dateiname: ${chunk.fileName} - Abschnitt: ${chunk.orderIndex + 1}\n` : ''}${chunk.content}`,
      )
      .join('\n\n');
    sections.push(
      `### Hochgeladene Dateien\nDie folgenden Inhalte stammen aus Dateien, die für den Chat bereitgestellt wurden:\n\n${fileTexts}`,
    );
  }

  if (webpageChunks.length > 0) {
    const linkTexts = webpageChunks
      .map(
        (chunk) => `Url: ${chunk.sourceUrl} - Abschnitt: ${chunk.orderIndex + 1}\n${chunk.content}`,
      )
      .join('\n\n');
    sections.push(
      `### Verlinkte Webseiten\nDie folgenden Inhalte stammen aus Links, die zum Chat gehören:\n\n${linkTexts}`,
    );
  }

  if (errorUrls.length > 0) {
    sections.push(
      `### Fehler beim Zugriff\nEs gab Probleme beim Zugriff auf die folgenden URLs:\n${errorUrls.map((url) => `- ${url}`).join('\n')}`,
    );
  }

  if (webSearchResults.length > 0) {
    const webSearchText = webSearchResults
      .map((result) => `Url: ${result.url}\n${result.content}`)
      .join('\n\n');
    sections.push(
      `### Websuche\nDie folgenden Inhalte stammen aus einer live Websuche:\n\n${webSearchText}`,
    );
  }

  if (sections.length === 0) return '';

  return `\n## Kontextinformationen\nNutze die folgenden Informationen, falls sinnvoll, für deine Antwort:\n\n${sections.join('\n\n')}`;
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
