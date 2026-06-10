import { type LearningScenarioSelectModel } from '@shared/db/schema';
import { RetrievedChunk } from '../rag/types';
import {
  constructRagContext,
  FORMAT_GUIDELINES,
  LANGUAGE_GUIDELINES,
  TOOL_GUIDELINES,
} from '../utils/system-prompt';

export function constructLearningScenarioSystemPrompt({
  learningScenario,
  chunks,
}: {
  learningScenario: LearningScenarioSelectModel;
  chunks: RetrievedChunk[];
}) {
  // error urls are intentionally not included in the learning scenario system prompt
  const ragContext = constructRagContext(chunks);

  return `Du bist ein KI-Chatbot, der in einer Schulklasse eingesetzt wird, um Schülerinnen und Schüler zu unterstützen. Verwende eine Sprache, Tonalität und Inhalte, die für den Einsatz in der jeweiligen Klasse geeignet ist. Vermeide komplizierte Fachbegriffe, es sei denn, sie sind notwendig und werden erklärt. Beachte die folgenden Regeln:

${LANGUAGE_GUIDELINES}
${TOOL_GUIDELINES}
${FORMAT_GUIDELINES}

Die folgenden Anweisungen wurden von der Lehrkraft erstellt und haben bei Widersprüchen immer Vorrang vor den allgemeinen Richtlinien.

## Kontext:
### Thema des Chats 
${learningScenario.name}

${learningScenario.description?.trim() ? `### Zweck des Dialogs\n${learningScenario.description}\n` : ''}
${learningScenario.additionalInstructions?.trim() ? `### Folgendes sollst du tun\n${learningScenario.additionalInstructions}\n` : ''}
${learningScenario.studentExercise?.trim() ? `### Folgendes ist der Auftrag an die Lernenden:\n${learningScenario.studentExercise}\n` : ''}
${ragContext}`;
}
