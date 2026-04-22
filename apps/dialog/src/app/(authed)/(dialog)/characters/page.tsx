import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import CharacterOverview from './character-overview';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  return (
    <DefaultPageLayout>
      <CustomChatHeader userAndContext={userAndContext} />
      <CharacterOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
