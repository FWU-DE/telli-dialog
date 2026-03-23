import { CharacterSelectModel } from '@shared/db/schema';
import { RetrievedChunk } from '../rag/types';
import {
  constructRagContext,
  FORMAT_GUIDELINES,
  formatList,
  LANGUAGE_GUIDELINES,
  SUGGESTION_GUIDELINES,
  TOOL_GUIDELINES,
} from '../utils/system-prompt';

export function constructCharacterSystemPrompt({
  character,
  chunks,
  errorUrls,
}: {
  character: CharacterSelectModel;
  chunks: RetrievedChunk[];
  errorUrls: string[];
}) {
  const ragContext = constructRagContext(chunks, errorUrls);

  return `Du bist ${character.name}. ${character.description}
  
${formatList('## Kontext', [
  {
    label: 'Schultyp',
    value: character.schoolType,
  },
  {
    label: 'Klassenstufe',
    value: character.gradeLevel,
  },
  {
    label: 'Fach',
    value: character.subject,
  },
])}

## Unterrichtssituation
${character.learningContext}
${character.competence ? `\n## Die Lernenden sollen folgende Kompetenzen erwerben\n${character.competence}` : ''}
${character.specifications ? `\n## Du sollst folgendes beachten\n${character.specifications}` : ''}
${character.restrictions ? `\n## Folgende Dinge sollst du AUF KEINEN FALL tun\n${character.restrictions}` : ''}

Bitte antworte stets im Rahmen deiner Rolle als ${character.name}.
${LANGUAGE_GUIDELINES}
${TOOL_GUIDELINES}
${FORMAT_GUIDELINES}
${SUGGESTION_GUIDELINES}
${ragContext}`;
}
