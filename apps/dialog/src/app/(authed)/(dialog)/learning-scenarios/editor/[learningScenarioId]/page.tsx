import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import HeaderPortal from '../../../header-portal';
import ProfileMenu from '@/components/navigation/profile-menu';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { requireAuth } from '@/auth/requireAuth';
import { getLearningScenarioForEditView } from '@shared/learning-scenarios/learning-scenario-service';
import { buildLegacyUserAndContext } from '@/auth/types';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { WebsearchSource } from '@shared/db/types';
import LearningScenarioForm from './learning-scenario-form';

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

  const { learningScenario, relatedFiles, avatarPictureUrl } = await getLearningScenarioForEditView(
    {
      learningScenarioId: learningScenarioId,
      schoolId: school.id,
      user,
    },
  ).catch(handleErrorInServerComponent);
  const readOnly = user.id !== learningScenario.userId;

  const initialLinks = learningScenario.attachedLinks
    .filter((l) => l && l !== '')
    .map(
      (url) =>
        ({
          link: url,
          type: 'websearch',
          error: false,
        }) as WebsearchSource,
    );

  return (
    <div className="w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="grow"></div>
        <ProfileMenu userAndContext={userAndContext} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <LearningScenarioForm
          {...learningScenario}
          existingFiles={relatedFiles}
          isCreating={isCreating}
          initialLinks={initialLinks}
          maybeSignedPictureUrl={avatarPictureUrl}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
