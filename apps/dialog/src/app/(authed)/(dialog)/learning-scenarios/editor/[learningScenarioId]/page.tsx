import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { requireAuth } from '@/auth/requireAuth';
import { getLearningScenario } from '@shared/learning-scenarios/learning-scenario-service';
import { buildLegacyUserAndContext } from '@/auth/types';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { WebsearchSource } from '@shared/db/types';
import LearningScenarioForm from './learning-scenario-form';
import { LearningScenarioEdit } from './learning-scenario-edit';
import { redirect } from 'next/navigation';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({ create: z.string().optional().default('false') });

export default async function Page(
  props: PageProps<'/learning-scenarios/editor/[learningScenarioId]'>,
) {
  const { learningScenarioId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const isCreating = searchParams.create === 'true';
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const { learningScenario, relatedFiles, avatarPictureUrl } = await getLearningScenario({
    learningScenarioId: learningScenarioId,
    schoolId: school.id,
    user,
  }).catch(handleErrorInServerComponent);
  const readOnly = user.id !== learningScenario.userId;

  if (federalState.featureToggles.isNewUiDesignEnabled && readOnly) {
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

  if (federalState.featureToggles.isNewUiDesignEnabled && !readOnly) {
    return (
      <DefaultPageLayout>
        <CustomChatHeader
          userAndContext={userAndContext}
          isNewUiDesignEnabled={federalState.featureToggles.isNewUiDesignEnabled}
        />
        <LearningScenarioEdit
          learningScenario={learningScenario}
          relatedFiles={relatedFiles}
          initialLinks={initialLinks}
          avatarPictureUrl={avatarPictureUrl}
        />
      </DefaultPageLayout>
    );
  }

  return (
    <DefaultPageLayout>
      <CustomChatHeader
        userAndContext={userAndContext}
        isNewUiDesignEnabled={federalState.featureToggles.isNewUiDesignEnabled}
      />
      <div className="mx-auto mt-4">
        <LearningScenarioForm
          {...learningScenario}
          existingFiles={relatedFiles}
          isCreating={isCreating}
          initialLinks={initialLinks}
          maybeSignedPictureUrl={avatarPictureUrl}
          readOnly={readOnly}
        />
      </div>
    </DefaultPageLayout>
  );
}
