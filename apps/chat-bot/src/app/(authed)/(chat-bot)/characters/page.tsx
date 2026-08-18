import { requireAuth } from '@/auth/requireAuth';
import CharacterOverview from './character-overview';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Spinner } from '@ui/components/spinner';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characters.page-titles');
  return {
    title: t('list'),
  };
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Spinner className="size-8" />
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}

async function PageContent() {
  const { user } = await requireAuth();

  return (
    <DefaultPageLayout>
      <CharacterOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
