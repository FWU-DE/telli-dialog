import { CharacterModel } from '@/db/schema';
import { BASE_FILE_PROMPT, constructSingleFilePrompt } from '../chat/system-prompt';
import { ChunkResult } from '../file-operations/process-chunks';

export function constructSystemPromptByCharacterSharedChat({
  character,
  retrievedTextChunks,
}: {
  character: CharacterModel;
  retrievedTextChunks: Record<string, ChunkResult[]>;
}) {
  const filePrompt =
    retrievedTextChunks !== undefined && Object.keys(retrievedTextChunks).length > 0
      ? BASE_FILE_PROMPT + Object.keys(retrievedTextChunks).map((fileId) => constructSingleFilePrompt(retrievedTextChunks?.[fileId] ?? []))
      : '';
  return `
Du bist ein KI-Chatbot, der in einer Schulklasse eingesetzt wird, um Schülerinnen und Schüler zu unterstützen. Verwende eine Sprache, Tonalität und Inhalte, die für den Einsatz in der jeweiligen Klasse geeignet ist. Vermeide komplizierte Fachbegriffe, es sei denn, sie sind notwendig und werden erklärt. Beachte die folgenden Regeln:
 
## Kontext:
- **Thema des Chats**: ${character.name}
- **Zweck des Dialogs**: ${character.description}
- **Schultyp**: ${character.schoolType}.
- **Klassenstufe**: ${character.gradeLevel}.
- **Fach**: ${character.subject}.

${filePrompt ?? ''}

## Unterrichtssituation
${character.learningContext}
 
## Anweisungen
Folgendes sollst du tun:
${character.learningContext}
 
## Folgendes musst du auf JEDEN FALL VERMEIDEN:
${character.restrictions}`;
}
