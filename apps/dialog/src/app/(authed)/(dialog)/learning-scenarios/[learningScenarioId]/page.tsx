import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getLearningScenario } from '@shared/learning-scenarios/learning-scenario-service';
import { LearningScenarioView } from './learning-scenario-view';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/learning-scenarios/[learningScenarioId]'>) {
  const { learningScenarioId } = await props.params;
  const { user } = await requireAuth();

  const { learningScenario, relatedFiles, avatarPictureUrl } = await getLearningScenario({
    learningScenarioId,
    schoolIds: user.schoolIds ?? [],
    user,
  }).catch(handleErrorInServerComponent);

  const initialLinks = learningScenario.attachedLinks.map((url) => ({ link: url }));

  return (
    <DefaultPageLayout>
      <LearningScenarioView
        learningScenario={learningScenario}
        fileMappings={relatedFiles}
        pictureUrl={avatarPictureUrl}
        initialLinks={initialLinks}
      />
    </DefaultPageLayout>
  );
}
