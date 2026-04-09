import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getLearningScenario } from '@shared/learning-scenarios/learning-scenario-service';
import { notFound } from 'next/navigation';
import { LearningScenarioView } from './learning-scenario-view';
import { ResponsiveLayoutWrapper } from '../../_components/responsive-layout-wrapper';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/learning-scenarios/[learningScenarioId]'>) {
  const { learningScenarioId } = await props.params;
  const { user, school, federalState } = await requireAuth();

  if (!federalState.featureToggles.isNewUiDesignEnabled) {
    notFound();
  }

  const { learningScenario, relatedFiles, avatarPictureUrl } = await getLearningScenario({
    learningScenarioId,
    schoolId: school.id,
    user,
  }).catch(handleErrorInServerComponent);

  const initialLinks = learningScenario.attachedLinks.map((url) => ({ link: url }));

  return (
    <ResponsiveLayoutWrapper>
      <LearningScenarioView
        learningScenario={learningScenario}
        fileMappings={relatedFiles}
        pictureUrl={avatarPictureUrl}
        initialLinks={initialLinks}
      />
    </ResponsiveLayoutWrapper>
  );
}
