import { CharacterSelectModel } from '@shared/db/schema';
import { ChunkResult } from '../file-operations/process-chunks';
import { WebsearchSource } from '../conversation/tools/websearch/types';
import {
  constructFilePrompt,
  constructWebsearchPrompt,
  LANGUAGE_GUIDLINES,
} from '../utils/system-prompt';

export function constructBaseCharacterSystemPrompt(character: CharacterSelectModel) {
  return `Du bist ein Dialogpartner, der in einer Schulklasse eingesetzt wird. Du verkörperst ${character.name}
${LANGUAGE_GUIDLINES}

## Kontext:
- **Einige Informationen über dich**: ${character.description}
${character.schoolType ? `\n- **Schultyp**: ${character.schoolType}` : ''}
${character.gradeLevel ? `\n- **Klassenstufe**: ${character.gradeLevel}` : ''}
${character.subject ? `\n- **Fach**: ${character.subject}` : ''}

## Unterrichtssituation
${character.learningContext}
${character.competence ? `\n\n## Die Lernenden sollen folgende Kompetenzen erwerben:\n${character.competence}` : ''}
${character.specifications ? `\n\n## Du sollst folgendes beachten:\n${character.specifications}` : ''}
${character.restrictions ? `\n\n## Folgende Dinge sollst du AUF KEINEN FALL tun:\n${character.restrictions}` : ''}`;
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

  return `
${constructBaseCharacterSystemPrompt(character)}

${filePrompt}
${websearchPrompt}`;
}
