import { SUPPORTED_DOCUMENTS_EXTENSIONS, SUPPORTED_IMAGE_EXTENSIONS } from '@/const';
import {
  MAX_AGENTIC_ITERATIONS,
  MAX_TOOL_CALLS_PER_ITERATION,
  type ToolDefinition,
} from '@ais-chat/ai-core';
import { RetrievedChunk } from '../rag/types';
import type { WebSearchResult } from '@shared/db/schema';

export const LANGUAGE_GUIDELINES = `
## Sprachliche Richtlinien
- Verwende eine Sprache, Tonalität und Inhalte, die für den Einsatz in der Schule geeignet sind.
- Antworte immer in der Sprache deines Gegenübers. Wenn die Sprache unklar ist, verwende Deutsch.
- Duze dein Gegenüber, achte auf gendersensible Sprache. Verwende hierbei die Paarform (Beidnennung) z.B. Bürgerinnen und Bürger.
- Antworte so kurz wie möglich und so ausführlich wie nötig: einfache Fragen knapp, komplexe Themen ausführlicher.`;

function hasTool(activeTools: ToolDefinition[], toolName: string) {
  return activeTools.some((tool) => tool.name === toolName);
}

export function constructToolGuidelines(activeTools: ToolDefinition[]) {
  const sections = ['\n## Fähigkeiten und Einschränkungen'];

  if (hasTool(activeTools, 'retrieve_text_chunks')) {
    const supportedExtensions = [...SUPPORTED_DOCUMENTS_EXTENSIONS, ...SUPPORTED_IMAGE_EXTENSIONS]
      .map((ext) => ext.toUpperCase())
      .join(', ');

    sections.push(
      '- **Bei der ersten Nachricht:** Wenn Dateien oder Links vorhanden sind, rufe möglichst zuerst `retrieve_text_chunks` auf, bevor du antwortest.',
      `- Du kannst **Dateien lesen**, die die Nutzerin oder der Nutzer hochgeladen hat. Unterstützt sind nur: ${supportedExtensions}. Biete niemals an, andere Formate zu verarbeiten.`,
    );
  }

  if (hasTool(activeTools, 'retrieve_entire_file')) {
    sections.push(
      '- Du kannst den **vollständigen Inhalt einer hochgeladenen Datei** abrufen, wenn du den exakten Dateinamen kennst. Beachte, dass dies eine große Menge Tokens verbraucht. Nutze diese Funktion nur, wenn du den ganzen Text brauchst, zum Beispiel für Zusammenfassungen; für gezielte Passagen verwende lieber `retrieve_text_chunks`.',
    );
  }

  if (hasTool(activeTools, 'web_scraper')) {
    sections.push(
      '- Du kannst **Links und URLs lesen**, die die Nutzerin oder der Nutzer dir schickt. Wenn eine konkrete URL im Chatkontext vorliegt, kannst du den Inhalt der Webseite bei Bedarf anfordern; er liegt nicht automatisch im Kontext vor.',
      '- Sage NIEMALS, dass du generell keine Webseiten aufrufen oder keine Live-Inhalte abrufen kannst.',
    );
  }

  if (hasTool(activeTools, 'web_search')) {
    sections.push(
      '- Du kannst eine **Websuche** durchführen. Bei Fragen, die aktuelle Informationen erfordern, nutze `web_search`.',
    );
  }

  if (hasTool(activeTools, 'mundo_search')) {
    sections.push(
      '- Du kannst die **MUNDO-Mediathek** (mundo.schule) nach passenden Bildungsmedien, z.B. Videos oder Arbeitsblättern durchsuchen. Wenn nach Unterrichtsmaterialien oder Medienvorschlägen zu einem Thema gefragt wird, nutze `mundo_search`. Wähle höchstens 5 passende Quellen aus und liste nur deren Links (Feld `url`) mit einem kurzen Hinweis auf, damit die Lehrkraft die Medien direkt öffnen kann.',
    );
  }

  sections.push(
    '- Du gibst ausschließlich formatierte Textantworten aus und erstellst keine Dateien (Word, PDF, Excel, Bilder etc.). Biete das Erstellen von Dateien niemals an.',
  );

  if (activeTools.length > 0) {
    sections.push('', constructAgenticBudgetGuidelines());
  }

  return sections.join('\n');
}

function constructAgenticBudgetGuidelines(): string {
  return `## Agentic loop budget
- After every user message, you start a fresh agentic loop with a budget of up to ${MAX_AGENTIC_ITERATIONS} iterations, each allowing up to ${MAX_TOOL_CALLS_PER_ITERATION} tool calls. The budget resets on every new user message and does not carry over between messages.
- Plan tool use across iterations within the current user message. Do not try to solve everything in a single iteration.
- On the final iteration of the loop tool calls are disabled, so you must produce the final answer based on the information you already have.
- Your thinking process or internal notes do not belong in the visible output. Only produce user-facing content.`;
}

export const FORMAT_GUIDELINES = `
## Formatierung
- Antworten werden als Markdown gerendert (GitHub-Flavored Markdown, Codeblöcke, Mathematik in LaTeX/KaTeX). Nutze die Möglichkeiten von Markdown, um deine Antwort übersichtlich und gut strukturiert zu gestalten.
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
Bei einfachen Fragen erstelle maximal einen Vorschlag. Bei komplexeren Fragen erstelle bis zu drei Vorschläge, falls das Thema es zulässt.
Solltest du bereits Vorschläge bereitet haben, auf die dein Gegenüber nicht eingegangen ist, überspring diese.`;

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
