import { HELP_MODE_ASSISTANT_ID } from '@shared/db/const';

export function resolveAgentNameForTracing({
  characterId,
  learningScenarioId,
  assistantId,
}: {
  characterId?: string;
  learningScenarioId?: string;
  assistantId?: string;
}): string {
  if (characterId) return 'Character';
  if (learningScenarioId) return 'Learning Scenario';
  if (assistantId) {
    if (assistantId === HELP_MODE_ASSISTANT_ID) return 'Help Mode';
    return 'Assistant';
  }
  return 'Chat';
}
