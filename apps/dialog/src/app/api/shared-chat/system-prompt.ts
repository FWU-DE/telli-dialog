import { type LearningScenarioSelectModel } from '@shared/db/schema';
import { RetrievedChunk } from '../rag/types';
import { constructRagContext, formatList, LANGUAGE_GUIDELINES } from '../utils/system-prompt';

export function constructLearningScenarioSystemPrompt({
  sharedChat,
  chunks,
}: {
  sharedChat: LearningScenarioSelectModel;
  chunks: RetrievedChunk[];
}) {
  const ragContext = constructRagContext(chunks);

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

${sharedChat.studentExercise.length !== 0 ? `Folgendes ist der Auftrag an die Lernenden:\n${sharedChat.studentExercise}` : ''}

## Verhalte dich wie folgt
${sharedChat.additionalInstructions}

${ragContext}`;
}
