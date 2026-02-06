import { CharacterSelectModel } from '@shared/db/schema';
import { ChunkResult } from '../file-operations/process-chunks';
import {
  constructFilePrompt,
  constructWebsearchPrompt,
  formatList,
  LANGUAGE_GUIDELINES,
} from '../utils/system-prompt';
import { WebsearchSource } from '@shared/db/types';

export function constructBaseCharacterSystemPrompt(character: CharacterSelectModel) {
  return `Du bist ${character.name}. ${character.description}
  
${LANGUAGE_GUIDELINES}

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

Bitte antworte stets im Rahmen deiner Rolle als ${character.name}.`;
}

export function constructCharacterSystemPrompt({
  character,
  retrievedTextChunks,
  websearchSources,
}: {
  character: CharacterSelectModel;
  retrievedTextChunks?: Record<string, ChunkResult[]>;
  websearchSources?: WebsearchSource[];
}) {
  const filePrompt = constructFilePrompt(retrievedTextChunks);
  const websearchPrompt = constructWebsearchPrompt(websearchSources);

  return `${constructBaseCharacterSystemPrompt(character)}

${filePrompt}
${websearchPrompt}`;
}
