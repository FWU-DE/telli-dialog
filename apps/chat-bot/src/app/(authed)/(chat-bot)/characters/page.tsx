import { requireAuth } from '@/auth/requireAuth';
import CharacterOverview from './character-overview';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
