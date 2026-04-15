'use server';

import { requireAuth } from '@/auth/requireAuth';
import type { OverviewFilter } from '@shared/overview-filter';
import { getCharactersByOverviewFilter } from '@shared/characters/character-service';
import {
  getLearningScenariosByOverviewFilter,
  enrichLearningScenarioWithPictureUrl,
  type LearningScenarioWithImage,
} from '@shared/learning-scenarios/learning-scenario-service';
import { getAssistantsByOverviewFilter } from '@shared/assistants/assistant-service';
import { enrichCharactersWithImage, type CharacterWithImage } from '../characters/utils';
import { enrichAssistantsWithImage, type AssistantWithImage } from '../custom/utils';
import { HELP_MODE_ASSISTANT_ID } from '@shared/db/const';

function resolveFilter(filter: OverviewFilter, isSchoolSharingEnabled: boolean): OverviewFilter {
  return !isSchoolSharingEnabled && filter === 'school' ? 'all' : filter;
}

export async function getCharactersByFilterAction(
  filter: OverviewFilter,
  emptyNamePlaceholder: string,
): Promise<CharacterWithImage[]> {
  const { user, school, federalState } = await requireAuth();
  const effectiveFilter = resolveFilter(
    filter,
    federalState.featureToggles.isShareTemplateWithSchoolEnabled,
  );

  const characters = await getCharactersByOverviewFilter({
    filter: effectiveFilter,
    userId: user.id,
    schoolId: school.id,
    federalStateId: federalState.id,
  });

  const enrichedCharacters = await enrichCharactersWithImage({ characters });
  return enrichedCharacters.map((c) => ({ ...c, name: c.name || emptyNamePlaceholder }));
}

export async function getLearningScenariosByFilterAction(
  filter: OverviewFilter,
  emptyNamePlaceholder: string,
): Promise<LearningScenarioWithImage[]> {
  const { user, school, federalState } = await requireAuth();
  const effectiveFilter = resolveFilter(
    filter,
    federalState.featureToggles.isShareTemplateWithSchoolEnabled,
  );

  const learningScenarios = await getLearningScenariosByOverviewFilter({
    filter: effectiveFilter,
    userId: user.id,
    schoolId: school.id,
    federalStateId: federalState.id,
  });

  const enrichedLearningScenarios = await enrichLearningScenarioWithPictureUrl({
    learningScenarios,
  });
  return enrichedLearningScenarios.map((s) => ({ ...s, name: s.name || emptyNamePlaceholder }));
}

export async function getAssistantsByFilterAction(
  filter: OverviewFilter,
  emptyNamePlaceholder: string,
): Promise<AssistantWithImage[]> {
  const { user, school, federalState } = await requireAuth();
  const effectiveFilter = resolveFilter(
    filter,
    federalState.featureToggles.isShareTemplateWithSchoolEnabled,
  );

  const assistants = await getAssistantsByOverviewFilter({
    filter: effectiveFilter,
    userId: user.id,
    schoolId: school.id,
    federalStateId: federalState.id,
  });

  const enrichedAssistants = await enrichAssistantsWithImage({
    assistants: assistants.filter((a) => a.id !== HELP_MODE_ASSISTANT_ID),
  });
  return enrichedAssistants.map((a) => ({ ...a, name: a.name || emptyNamePlaceholder }));
}
