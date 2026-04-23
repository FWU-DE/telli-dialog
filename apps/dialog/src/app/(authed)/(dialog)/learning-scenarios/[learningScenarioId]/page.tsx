import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getLearningScenario } from '@shared/learning-scenarios/learning-scenario-service';
import { LearningScenarioView } from './learning-scenario-view';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import { buildLegacyUserAndContext } from '@/auth/types';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/learning-scenarios/[learningScenarioId]'>) {
  const { learningScenarioId } = await props.params;
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const { learningScenario, relatedFiles, avatarPictureUrl } = await getLearningScenario({
    learningScenarioId,
    schoolId: school.id,
    user,
  }).catch(handleErrorInServerComponent);

  const initialLinks = learningScenario.attachedLinks.map((url) => ({ link: url }));

  return (
    <DefaultPageLayout userAndContext={userAndContext}>
      <LearningScenarioView
        learningScenario={learningScenario}
        fileMappings={relatedFiles}
        pictureUrl={avatarPictureUrl}
        initialLinks={initialLinks}
      />
    </DefaultPageLayout>
  );
}
