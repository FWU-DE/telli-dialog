import { requireAuth } from '@/auth/requireAuth';
import CharacterOverview from './character-overview';
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
    <DefaultPageLayout userAndContext={userAndContext}>
      <CharacterOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
