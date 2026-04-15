import ProfileMenu from '@/components/navigation/profile-menu';
import { permanentRedirect } from 'next/navigation';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import HeaderPortal from '../../../header-portal';
import AssistantForm from './custom-gpt-form';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { AssistantSelectModel } from '@shared/db/schema';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { getAssistantByUser } from '@shared/assistants/assistant-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { WebsearchSource } from '@shared/db/types';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  create: z.string().optional().default('false'),
  templateId: z.string().optional(),
});

export default async function Page(props: PageProps<'/custom/editor/[customGptId]'>) {
  const { customGptId: assistantId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const isCreating = searchParams.create === 'true';

  const { user, school, federalState } = await requireAuth();

  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const { assistant, fileMappings, pictureUrl } = await getAssistantByUser({
    assistantId,
    schoolId: school.id,
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  const readOnly = assistant.userId !== user.id;

  if (federalState.featureToggles.isNewUiDesignEnabled) {
    if (readOnly) {
      permanentRedirect(`/assistants/${assistantId}`);
    }
    permanentRedirect(`/assistants/editor/${assistantId}`);
  }

  const initialLinks = assistant.attachedLinks
    .filter((l) => l !== '')
    .map(
      (url) =>
        ({
          link: url,
          error: false,
        }) as WebsearchSource,
    );

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton
          isNewUiDesignEnabled={federalState.featureToggles.isNewUiDesignEnabled}
        />
        <div className="grow"></div>
        <ProfileMenu userAndContext={userAndContext} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <AssistantForm
          {...(removeNullishValues(assistant) as AssistantSelectModel)}
          maybeSignedPictureUrl={pictureUrl}
          isCreating={isCreating}
          readOnly={readOnly}
          userRole={user.userRole}
          initialLinks={initialLinks}
          existingFiles={fileMappings}
        />
      </div>
    </div>
  );
}
