import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getLearningScenario } from '@shared/learning-scenarios/learning-scenario-service';
import { LearningScenarioView } from './learning-scenario-view';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getPriceInCentByUser, getPriceLimitInCentByUser } from '@/app/school';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('learning-scenarios.page-titles');
  return {
    title: t('view'),
  };
}

export default async function Page(props: PageProps<'/learning-scenarios/[learningScenarioId]'>) {
  const { learningScenarioId } = await props.params;
  const { user, federalState } = await requireAuth();

  const [{ learningScenario, relatedFiles, avatarPictureUrl }, userPriceLimit, priceInCent] =
    await Promise.all([
      getLearningScenario({
        learningScenarioId,
        user,
      }).catch(handleErrorInServerComponent),
      getPriceLimitInCentByUser({ ...user, federalState }),
      getPriceInCentByUser({ ...user, federalState }),
    ]);

  const initialLinks = learningScenario.attachedLinks.map((url) => ({ link: url }));

  return (
    <DefaultPageLayout>
      <LearningScenarioView
        learningScenario={learningScenario}
        fileMappings={relatedFiles}
        pictureUrl={avatarPictureUrl}
        initialLinks={initialLinks}
        usedBudget={priceInCent ?? 0}
        maxBudget={userPriceLimit ?? 500}
      />
    </DefaultPageLayout>
  );
}
