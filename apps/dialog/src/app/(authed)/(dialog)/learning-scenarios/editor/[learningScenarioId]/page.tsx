import { requireAuth } from '@/auth/requireAuth';
import { getLearningScenario } from '@shared/learning-scenarios/learning-scenario-service';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { WebsearchSource } from '@shared/db/types';
import { LearningScenarioEdit } from './learning-scenario-edit';
import { redirect } from 'next/navigation';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page(
  props: PageProps<'/learning-scenarios/editor/[learningScenarioId]'>,
) {
  const { learningScenarioId } = await props.params;
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
    hasApiKeyAssigned: federalState.hasApiKeyAssigned,
  };

  const { learningScenario, relatedFiles, avatarPictureUrl } = await getLearningScenario({
    learningScenarioId: learningScenarioId,
    schoolIds: user.schoolIds ?? [],
    user,
  }).catch(handleErrorInServerComponent);
  const readOnly = user.id !== learningScenario.userId;

  if (readOnly) {
    redirect(`/learning-scenarios/${learningScenarioId}`);
  }

  const initialLinks = learningScenario.attachedLinks
    .filter((l) => l && l !== '')
    .map(
      (url) =>
        ({
          link: url,
          error: false,
        }) as WebsearchSource,
    );

  return (
    <DefaultPageLayout userAndContext={userAndContext}>
      <LearningScenarioEdit
        learningScenario={learningScenario}
        relatedFiles={relatedFiles}
        initialLinks={initialLinks}
        avatarPictureUrl={avatarPictureUrl}
      />
    </DefaultPageLayout>
  );
}
