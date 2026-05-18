import { requireAuth } from '@/auth/requireAuth';
import CharacterOverview from './character-overview';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characters.page-titles');
  return {
    title: t('list'),
  };
}

export default async function Page() {
  const { user } = await requireAuth();

  return (
    <DefaultPageLayout>
      <CharacterOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
