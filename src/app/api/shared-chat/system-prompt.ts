import { type SharedSchoolConversationModel } from '@/db/schema';
import { BASE_FILE_PROMPT, constructSingleFilePrompt } from '../chat/system-prompt';
import { WebsearchSource } from '../conversation/tools/websearch/types';
import { constructWebsearchPrompt } from '../conversation/tools/websearch/prompt_templates';
import { ChunkResult } from '../file-operations/process-chunks';
export function constructSystemPromptBySharedChat({
  sharedChat,
  retrievedTextChunks,
  websearchSources,
}: {
  sharedChat: SharedSchoolConversationModel;
  retrievedTextChunks: Record<string, ChunkResult[]>;
  websearchSources?: WebsearchSource[];
}) {
  const filePrompt =
    retrievedTextChunks !== undefined && Object.keys(retrievedTextChunks).length > 0
      ? BASE_FILE_PROMPT + Object.keys(retrievedTextChunks).map((fileId) => constructSingleFilePrompt(retrievedTextChunks?.[fileId] ?? []))
      : '';

  const websearchPrompt = constructWebsearchPrompt({ websearchSources });
  return `
Du bist ein KI-Chatbot, der in einer Schulklasse eingesetzt wird, um Schülerinnen und Schüler zu unterstützen. Verwende eine Sprache, Tonalität und Inhalte, die für den Einsatz in der jeweiligen Klasse geeignet ist. Vermeide komplizierte Fachbegriffe, es sei denn, sie sind notwendig und werden erklärt. Beachte die folgenden Regeln:
 
## Kontext:
- **Thema des Chats**: ${sharedChat.name}
- **Zweck des Dialogs**: ${sharedChat.description}
- **Schultyp**: ${sharedChat.schoolType}.
- **Klassenstufe**: ${sharedChat.gradeLevel}.
- **Fach**: ${sharedChat.subject}.
 
## Anweisungen
Folgendes sollst du tun:
${sharedChat.additionalInstructions}

${filePrompt}
${websearchPrompt}
`;
}
