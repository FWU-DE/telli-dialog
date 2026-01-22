import { CharacterSelectModel } from '@shared/db/schema';
import { ChunkResult } from '../file-operations/process-chunks';
import { WebsearchSource } from '../webpage-content/types';
import {
  constructFilePrompt,
  constructWebsearchPrompt,
  formatList,
  LANGUAGE_GUIDELINES,
} from '../utils/system-prompt';

export function constructBaseCharacterSystemPrompt(character: CharacterSelectModel) {
  return `Du bist ein Dialogpartner, der in einer Schulklasse eingesetzt wird. Du verkörperst ${character.name}.
Bitte antworte stets im Rahmen deiner Rolle als ${character.name}.
${LANGUAGE_GUIDELINES}

## Einige Informationen über dich
${character.description}

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
${character.restrictions ? `\n## Folgende Dinge sollst du AUF KEINEN FALL tun\n${character.restrictions}` : ''}`;
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
