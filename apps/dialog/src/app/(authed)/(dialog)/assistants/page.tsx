import { requireAuth } from '@/auth/requireAuth';
import AssistantOverview from './assistant-overview';
import { buildLegacyUserAndContext } from '@/auth/types';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  return (
    <DefaultPageLayout userAndContext={userAndContext}>
      <AssistantOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
