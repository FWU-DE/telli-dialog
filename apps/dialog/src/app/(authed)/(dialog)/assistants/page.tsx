import { requireAuth } from '@/auth/requireAuth';
import AssistantOverview from './assistant-overview';
import notFound from '../not-found';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user, federalState } = await requireAuth();

  if (!federalState.featureToggles.isNewUiDesignEnabled) {
    notFound();
  }

  return <AssistantOverview currentUserId={user.id} />;
}
