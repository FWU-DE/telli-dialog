import { requireAuth } from '@/auth/requireAuth';
import AssistantOverview from './assistant-overview';
import notFound from '../not-found';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import { buildLegacyUserAndContext } from '@/auth/types';
import { OverviewPageLayout } from '@/components/layout/overview-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  if (!federalState.featureToggles.isNewUiDesignEnabled) {
    notFound();
  }

  return (
    <OverviewPageLayout>
      <CustomChatHeader
        userAndContext={userAndContext}
        isNewUiDesignEnabled={federalState.featureToggles.isNewUiDesignEnabled}
      />

      <AssistantOverview currentUserId={user.id} />
    </OverviewPageLayout>
  );
}
