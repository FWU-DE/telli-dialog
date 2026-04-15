import { CharacterSelectModel } from '@shared/db/schema';
import { RetrievedChunk } from '../rag/types';
import {
  constructRagContext,
  FORMAT_GUIDELINES,
  LANGUAGE_GUIDELINES,
  TOOL_GUIDELINES,
} from '../utils/system-prompt';

export function constructCharacterSystemPrompt({
  character,
  chunks,
}: {
  character: CharacterSelectModel;
  chunks: RetrievedChunk[];
}) {
  // error urls are intentionally not included in the character system prompt
  const ragContext = constructRagContext(chunks);

  return `Du bist ${character.name}.
${character.description}

${LANGUAGE_GUIDELINES}
${TOOL_GUIDELINES}
${FORMAT_GUIDELINES}

Die folgenden Anweisungen wurden von der Lehrkraft erstellt und haben bei Widersprüchen immer Vorrang vor den allgemeinen Richtlinien.

## Anweisungen der Lehrkraft
${character.instructions}

Bitte antworte stets im Rahmen deiner Rolle als ${character.name}.
${ragContext}`;
}
