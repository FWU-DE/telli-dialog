import { requireAuth } from '@/auth/requireAuth';
import AssistantOverview from './assistant-overview';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user } = await requireAuth();
  return <AssistantOverview currentUserId={user.id} />;
}
