import { requireAuth } from '@/auth/requireAuth';
import CharacterOverview from './character-overview';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user } = await requireAuth();

  return (
    <DefaultPageLayout>
      <CharacterOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
