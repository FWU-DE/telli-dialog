import { type LearningScenarioSelectModel } from '@shared/db/schema';
import { RetrievedChunk } from '../rag/types';
import {
  constructRagContext,
  FORMAT_GUIDELINES,
  LANGUAGE_GUIDELINES,
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

${LANGUAGE_GUIDELINES}
${TOOL_GUIDELINES}
${FORMAT_GUIDELINES}

Die folgenden Anweisungen wurden von der Lehrkraft erstellt und haben bei Widersprüchen immer Vorrang vor den allgemeinen Richtlinien.

## Verhalte dich wie folgt
${sharedChat.additionalInstructions}

## Zweck des Dialogs
${sharedChat.description}

${sharedChat.studentExercise.length !== 0 ? `Folgendes ist der Auftrag an die Lernenden:\n${sharedChat.studentExercise}` : ''}
${ragContext}`;
}
