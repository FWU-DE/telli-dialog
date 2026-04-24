import { requireAuth } from '@/auth/requireAuth';
import LearningScenarioOverview from './learning-scenario-overview';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
    hasApiKeyAssigned: federalState.hasApiKeyAssigned,
  };

  return (
    <DefaultPageLayout>
      <CustomChatHeader userAndContext={userAndContext} />
      <LearningScenarioOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
