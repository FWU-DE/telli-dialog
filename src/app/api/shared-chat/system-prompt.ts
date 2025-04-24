import { FileModel, type SharedSchoolConversationModel } from '@/db/schema';
import { BASE_FILE_PROMPT, constructSingleFilePrompt } from '../chat/system-prompt';

export function constructSystemPromptBySharedChat({
  sharedChat,
  fileEntities,
}: {
  sharedChat: SharedSchoolConversationModel;
  fileEntities?: FileModel[];
}) {
  const filePrompt =
    fileEntities !== undefined
      ? BASE_FILE_PROMPT + fileEntities.map((file) => constructSingleFilePrompt(file))
      : '';

  return `
Du bist ein KI-Chatbot, der in einer Schulklasse eingesetzt wird, um Schülerinnen und Schüler zu unterstützen. Verwende eine Sprache, Tonalität und Inhalte, die für den Einsatz in der jeweiligen Klasse geeignet ist. Vermeide komplizierte Fachbegriffe, es sei denn, sie sind notwendig und werden erklärt. Beachte die folgenden Regeln:
 
## Kontext:
- **Thema des Chats**: ${sharedChat.name}
- **Zweck des Dialogs**: ${sharedChat.description}
- **Schultyp**: ${sharedChat.schoolType}.
- **Klassenstufe**: ${sharedChat.gradeLevel}.
- **Fach**: ${sharedChat.subject}.
 
## Unterrichtssituation
${sharedChat.learningContext}
 
## Anweisungen
Folgendes sollst du tun:
${sharedChat.learningContext}
 
## Folgendes musst du auf JEDEN FALL VERMEIDEN:
${sharedChat.restrictions}

${filePrompt}
`;
}
