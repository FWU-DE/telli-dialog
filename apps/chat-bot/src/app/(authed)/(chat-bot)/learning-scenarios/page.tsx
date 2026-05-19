import { requireAuth } from '@/auth/requireAuth';
import LearningScenarioOverview from './learning-scenario-overview';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('learning-scenarios.page-titles');
  return {
    title: t('list'),
  };
}

export default async function Page() {
  const { user } = await requireAuth();

  return (
    <DefaultPageLayout>
      <LearningScenarioOverview currentUserId={user.id} />
    </DefaultPageLayout>
  );
}
