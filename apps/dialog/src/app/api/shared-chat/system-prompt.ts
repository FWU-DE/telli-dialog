import { type SharedSchoolConversationModel } from '@shared/db/schema';
import { WebsearchSource } from '../conversation/tools/websearch/types';
import { ChunkResult } from '../file-operations/process-chunks';
import {
  constructFilePrompt,
  constructWebsearchPrompt,
  formatList,
  LANGUAGE_GUIDELINES,
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
${LANGUAGE_GUIDELINES}
 
${formatList('## Kontext', [
  {
    label: 'Thema des Chats',
    value: sharedChat.name,
  },
  {
    label: 'Schultyp',
    value: sharedChat.schoolType,
  },
  {
    label: 'Klassenstufe',
    value: sharedChat.gradeLevel,
  },
  {
    label: 'Fach',
    value: sharedChat.subject,
  },
])}

## Zweck des Dialogs
${sharedChat.description}

${sharedChat.studentExcercise.length !== 0 ? `Folgendes ist der Auftrag an die Lernenden:\n${sharedChat.studentExcercise}` : ''}

## Verhalte dich wie folgt
${sharedChat.additionalInstructions}

${filePrompt}
${websearchPrompt}`;
}
