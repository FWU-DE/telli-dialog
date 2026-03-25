import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { parseSearchParams } from '@/utils/parse-search-params';
import { accessLevelSchema } from '@shared/db/schema';
import { overviewFilterSchema } from '@shared/overview-filter';
import { z } from 'zod';
import {
  enrichLearningScenarioWithPictureUrl,
  getLearningScenariosByAccessLevel,
  getLearningScenariosByOverviewFilter,
} from '@shared/learning-scenarios/learning-scenario-service';
import { LearningScenarioContainer } from './learning-scenario-container';
import LearningScenarioOverview from './learning-scenario-overview';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  visibility: accessLevelSchema.optional().default('private'),
  filter: overviewFilterSchema.optional().default('all'),
});

export default async function Page(props: PageProps<'/learning-scenarios'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const { user, school, federalState } = await requireAuth();
  const isNewUi = federalState.featureToggles.isNewUiDesignEnabled;

  if (isNewUi) {
    const isSchoolSharingEnabled = federalState.featureToggles.isShareTemplateWithSchoolEnabled;
    const filter =
      !isSchoolSharingEnabled && searchParams.filter === 'school' ? 'all' : searchParams.filter;
    const _learningScenarios = await getLearningScenariosByOverviewFilter({
      filter,
      schoolId: school.id,
      userId: user.id,
      federalStateId: federalState.id,
    }).catch(handleErrorInServerComponent);
    const learningScenarios = _learningScenarios.filter((scenario) => scenario.name !== '');
    const enrichedLearningScenarios = await enrichLearningScenarioWithPictureUrl({
      learningScenarios,
    });

    return (
      <LearningScenarioOverview
        learningScenarios={enrichedLearningScenarios}
        activeFilter={filter}
        currentUserId={user.id}
      />
    );
  }

  const accessLevel = searchParams.visibility;
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const _learningScenarios = await getLearningScenariosByAccessLevel({
    accessLevel,
    schoolId: school.id,
    userId: user.id,
    federalStateId: federalState.id,
  }).catch(handleErrorInServerComponent);
  const learningScenarios = _learningScenarios.filter((scenario) => scenario.name !== '');
  const enrichedLearningScenarios = await enrichLearningScenarioWithPictureUrl({
    learningScenarios,
  });

  return (
    <LearningScenarioContainer
      accessLevel={accessLevel}
      learningScenarios={enrichedLearningScenarios}
      user={userAndContext}
    />
  );
}
