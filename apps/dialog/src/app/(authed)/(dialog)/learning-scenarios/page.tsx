import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { parseSearchParams } from '@/utils/parse-search-params';
import { accessLevelSchema } from '@shared/db/schema';
import { z } from 'zod';
import {
  enrichLearningScenarioWithPictureUrl,
  getLearningScenariosByAccessLevel,
} from '@shared/learning-scenarios/learning-scenario-service';
import { LearningScenarioContainer } from './learning-scenario-container';
import LearningScenarioOverview from './learning-scenario-overview';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import { OverviewPageLayout } from '@/components/layout/overview-page-layout';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  visibility: accessLevelSchema.optional().default('private'),
});

export default async function Page(props: PageProps<'/learning-scenarios'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);
  const isNewUi = federalState.featureToggles.isNewUiDesignEnabled;

  if (isNewUi) {
    return (
      <OverviewPageLayout>
        <CustomChatHeader
          userAndContext={userAndContext}
          isNewUiDesignEnabled={federalState.featureToggles.isNewUiDesignEnabled}
        />
        <LearningScenarioOverview currentUserId={user.id} />
      </OverviewPageLayout>
    );
  }

  const accessLevel = searchParams.visibility;
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
