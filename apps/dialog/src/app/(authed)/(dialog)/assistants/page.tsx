import { requireAuth } from '@/auth/requireAuth';
import AssistantOverview from './assistant-overview';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
  };

  return (
    <DefaultPageLayout userAndContext={userAndContext}>
      <AssistantOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
