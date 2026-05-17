import { requireAuth } from '@/auth/requireAuth';
import AssistantOverview from './assistant-overview';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user } = await requireAuth();

  return (
    <DefaultPageLayout>
      <AssistantOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
