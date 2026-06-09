import { CharacterSelectModel } from '@shared/db/schema';
import { RetrievedChunk } from '../rag/types';
import {
  constructRagContext,
  constructToolGuidelines,
  FORMAT_GUIDELINES,
  LANGUAGE_GUIDELINES,
} from '../utils/system-prompt';
import type { ToolDefinition } from '@ais-chat/ai-core';

export function constructCharacterSystemPrompt({
  character,
  chunks,
  activeToolDefinitions = [],
}: {
  character: CharacterSelectModel;
  chunks: RetrievedChunk[];
  activeToolDefinitions?: ToolDefinition[];
}) {
  // error urls are intentionally not included in the character system prompt
  const ragContext = constructRagContext(chunks);

  return `Du bist ein Dialogpartner, der in einer Schule eingesetzt wird. Du verkörperst ${character.name}.
  
${LANGUAGE_GUIDELINES}
${constructToolGuidelines(activeToolDefinitions)}
${FORMAT_GUIDELINES}

Die folgenden Anweisungen wurden von der Lehrkraft erstellt und haben bei Widersprüchen immer Vorrang vor den allgemeinen Richtlinien.

${character.instructions?.trim() ? `### Anweisungen\n${character.instructions}\n` : ''}

${character.description?.trim() ? `### Beschreibung\n${character.description}\n` : ''}
Bitte antworte stets im Rahmen deiner Rolle als ${character.name}.
${ragContext}`;
}
