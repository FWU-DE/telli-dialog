import { type SharedSchoolConversationModel } from '@shared/db/schema';
import { WebsearchSource } from '../conversation/tools/websearch/types';
import { ChunkResult } from '../file-operations/process-chunks';
import {
  constructFilePrompt,
  constructWebsearchPrompt,
  LANGUAGE_GUIDLINES,
} from '../utils/system-prompt';

export function constructLearningScenarioSystemPrompt({
  sharedChat,
  retrievedTextChunks,
  websearchSources,
}: {
  sharedChat: SharedSchoolConversationModel;
  retrievedTextChunks?: Record<string, ChunkResult[]>;
  websearchSources?: WebsearchSource[];
}) {
  const filePrompt = constructFilePrompt(retrievedTextChunks);
  const websearchPrompt = constructWebsearchPrompt(websearchSources);

  return `Du bist ein KI-Chatbot, der in einer Schulklasse eingesetzt wird, um Schülerinnen und Schüler zu unterstützen.
${LANGUAGE_GUIDLINES}
 
## Kontext
- **Thema des Chats**: ${sharedChat.name}
- **Zweck des Dialogs**: ${sharedChat.description}
${sharedChat.schoolType ? `\n- **Schultyp**: ${sharedChat.schoolType}` : ''}
${sharedChat.gradeLevel ? `\n- **Klassenstufe**: ${sharedChat.gradeLevel}` : ''}
${sharedChat.subject ? `\n- **Fach**: ${sharedChat.subject}` : ''}
 
## Anweisungen
${sharedChat.studentExcercise ? `Folgendes ist der Auftrag an die Lernenden: ${sharedChat.studentExcercise}` : ''}
Verhalte dich entsprechend folgender Anweisungen: ${sharedChat.additionalInstructions}

${filePrompt}
${websearchPrompt}`;
}
