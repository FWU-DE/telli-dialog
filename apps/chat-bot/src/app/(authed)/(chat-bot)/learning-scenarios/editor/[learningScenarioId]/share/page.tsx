import { getTranslations } from 'next-intl/server';
import { getSharedLearningScenario } from '@shared/learning-scenarios/learning-scenario-service';
import { calculateShareSessionState } from '@shared/sharing/calculate-share-session-state';
import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { notFound } from 'next/navigation';
import { type Metadata } from 'next';
import CustomChatSharePage from '@/components/custom-chat/custom-chat-share-page';
import { Suspense } from 'react';
import { Spinner } from '@ui/components/spinner';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('learning-scenarios.page-titles');
  return {
    title: t('share'),
  };
}

export default function Page(
  props: PageProps<'/learning-scenarios/editor/[learningScenarioId]/share'>,
) {
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
  params: PageProps<'/learning-scenarios/editor/[learningScenarioId]/share'>['params'];
}) {
  const { learningScenarioId } = await params;
  const { user } = await requireAuth();

  const learningScenario = await getSharedLearningScenario({
    learningScenarioId: learningScenarioId,
    user,
  }).catch(handleErrorInServerComponent);

  if (!learningScenario.inviteCode) {
    notFound();
  }

  const inviteCode = learningScenario.inviteCode;
  const shareUrl = `/ua/learning-scenarios/${learningScenario.id}/dialog?inviteCode=${inviteCode}`;
  const leftTime = calculateShareSessionState(learningScenario).timeLeftInSeconds;

  return (
    <CustomChatSharePage
      backHref={`/learning-scenarios/editor/${learningScenario.id}`}
      customChatName={learningScenario.name}
      inviteCode={inviteCode}
      leftTimeInSeconds={leftTime}
      relativeShareUrl={shareUrl}
      totalTimeInSeconds={learningScenario.maxUsageTimeLimit * 60}
      customChatVariant="learning-scenario"
      expiredAt={learningScenario.expiredAt}
      manuallyStoppedAt={learningScenario.manuallyStoppedAt}
      customChatId={learningScenario.id}
      sharingUserId={learningScenario.startedBy}
    />
  );
}
