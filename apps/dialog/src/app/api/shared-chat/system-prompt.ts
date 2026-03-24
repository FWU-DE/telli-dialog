import { type LearningScenarioSelectModel } from '@shared/db/schema';
import { RetrievedChunk } from '../rag/types';
import {
  constructRagContext,
  FORMAT_GUIDELINES,
  formatList,
  LANGUAGE_GUIDELINES,
  SUGGESTION_GUIDELINES,
  TOOL_GUIDELINES,
} from '../utils/system-prompt';

export function constructLearningScenarioSystemPrompt({
  sharedChat,
  chunks,
}: {
  sharedChat: LearningScenarioSelectModel;
  chunks: RetrievedChunk[];
}) {
  // error urls are intentionally not included in the learning scenario system prompt
  const ragContext = constructRagContext(chunks);

  return `Du bist ein KI-Chatbot, der in einer Schulklasse eingesetzt wird, um Schülerinnen und Schüler zu unterstützen.

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

${sharedChat.studentExercise.length !== 0 ? `Folgendes ist der Auftrag an die Lernenden:\n${sharedChat.studentExercise}` : ''}

## Verhalte dich wie folgt
${sharedChat.additionalInstructions}
${LANGUAGE_GUIDELINES}
${TOOL_GUIDELINES}
${FORMAT_GUIDELINES}
${SUGGESTION_GUIDELINES}
${ragContext}`;
}
