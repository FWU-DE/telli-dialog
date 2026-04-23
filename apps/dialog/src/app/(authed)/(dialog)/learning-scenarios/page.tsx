import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import LearningScenarioOverview from './learning-scenario-overview';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  return (
    <DefaultPageLayout userAndContext={userAndContext}>
      <LearningScenarioOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
