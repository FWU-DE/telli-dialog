import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getLearningScenarioForEditView } from '@shared/learning-scenarios/learning-scenario-service';
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

  const { learningScenario, relatedFiles, avatarPictureUrl } = await getLearningScenarioForEditView(
    {
      learningScenarioId,
      schoolId: school.id,
      user,
    },
  ).catch(handleErrorInServerComponent);

  const initialLinks = learningScenario.attachedLinks
    .filter((l) => l && l !== '')
    .map((url) => ({ link: url }));

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
