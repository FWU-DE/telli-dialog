import { getTranslations } from 'next-intl/server';
import { getSharedLearningScenario } from '@shared/learning-scenarios/learning-scenario-service';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { notFound } from 'next/navigation';
import { type Metadata } from 'next';
import CustomChatSharePage from '@/components/custom-chat/custom-chat-share-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('learning-scenarios.page-titles');
  return {
    title: t('share'),
  };
}

export default async function Page(
  props: PageProps<'/learning-scenarios/editor/[learningScenarioId]/share'>,
) {
  const { learningScenarioId } = await props.params;
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
  const leftTime = calculateTimeLeft(learningScenario);

  return (
    <CustomChatSharePage
      backHref={`/learning-scenarios/editor/${learningScenario.id}`}
      customChatName={learningScenario.name}
      inviteCode={inviteCode}
      leftTimeInSeconds={leftTime}
      relativeShareUrl={shareUrl}
      totalTimeInSeconds={learningScenario.maxUsageTimeLimit * 60}
      customChatVariant="learning-scenario"
    />
  );
}
