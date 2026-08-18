import { requireAuth } from '@/auth/requireAuth';
import { isWebSearchAvailableForFederalState } from '@/app/api/chat/websearch';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getLearningScenarioForEditView } from '@shared/learning-scenarios/learning-scenario-service';
import { LearningScenarioView } from './learning-scenario-view';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Spinner } from '@ui/components/spinner';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('learning-scenarios.page-titles');
  return {
    title: t('view'),
  };
}

export default function Page(props: PageProps<'/learning-scenarios/[learningScenarioId]'>) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Spinner className="size-8" />
        </div>
      }
    >
      <PageContent params={props.params} />
    </Suspense>
  );
}

async function PageContent({
  params,
}: {
  params: PageProps<'/learning-scenarios/[learningScenarioId]'>['params'];
}) {
  const { learningScenarioId } = await params;
  const { user, federalState } = await requireAuth();

  const {
    learningScenario,
    relatedFiles,
    avatarPictureUrl,
    maxBudget,
    usedBudget,
    budgetUsedBySharedChat,
  } = await getLearningScenarioForEditView({
    learningScenarioId,
    user,
    federalState,
  }).catch(handleErrorInServerComponent);

  const initialLinks = learningScenario.attachedLinks.map((url) => ({ link: url }));

  return (
    <DefaultPageLayout>
      <LearningScenarioView
        learningScenario={learningScenario}
        fileMappings={relatedFiles}
        pictureUrl={avatarPictureUrl}
        initialLinks={initialLinks}
        usedBudget={usedBudget ?? 0}
        maxBudget={maxBudget ?? 500}
        budgetUsedBySharedChat={budgetUsedBySharedChat}
        isWebSearchAvailable={isWebSearchAvailableForFederalState(federalState.featureToggles)}
      />
    </DefaultPageLayout>
  );
}
