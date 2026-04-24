import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getLearningScenario } from '@shared/learning-scenarios/learning-scenario-service';
import { LearningScenarioView } from './learning-scenario-view';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/learning-scenarios/[learningScenarioId]'>) {
  const { learningScenarioId } = await props.params;
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
    hasApiKeyAssigned: federalState.hasApiKeyAssigned,
  };

  const { learningScenario, relatedFiles, avatarPictureUrl } = await getLearningScenario({
    learningScenarioId,
    schoolIds: user.schoolIds ?? [],
    user,
  }).catch(handleErrorInServerComponent);

  const initialLinks = learningScenario.attachedLinks.map((url) => ({ link: url }));

  return (
    <DefaultPageLayout>
      <CustomChatHeader userAndContext={userAndContext} />
      <LearningScenarioView
        learningScenario={learningScenario}
        fileMappings={relatedFiles}
        pictureUrl={avatarPictureUrl}
        initialLinks={initialLinks}
      />
    </DefaultPageLayout>
  );
}
