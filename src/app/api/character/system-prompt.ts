import { CharacterModel, FileModel } from '@/db/schema';
import { BASE_FILE_PROMPT, constructSingleFilePrompt } from '../chat/system-prompt';

export function constructSystemPromptByCharacterSharedChat({
  character,
  fileEntities,
}: {
  character: CharacterModel;
  fileEntities?: FileModel[];
}) {
  const filePrompt =
    fileEntities !== undefined
      ? BASE_FILE_PROMPT + fileEntities.map((file) => constructSingleFilePrompt(file))
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
