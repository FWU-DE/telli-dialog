import Refresh from '@/components/refresh';
import { SharedChatContainer } from './shared-chat-container';
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

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  visibility: accessLevelSchema.optional().default('private'),
});

export default async function Page(props: PageProps<'/learning-scenarios'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const accessLevel = searchParams.visibility;
  const { user, school, federalState } = await requireAuth();
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
    <main className="w-full p-6">
      <Refresh />
      <SharedChatContainer
        accessLevel={accessLevel}
        learningScenarios={enrichedLearningScenarios}
        user={userAndContext}
      />
    </main>
  );
}
