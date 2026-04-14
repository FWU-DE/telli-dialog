import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAssistantByUser } from '@shared/assistants/assistant-service';
import { notFound } from 'next/navigation';
import { AssistantEdit } from './assistant-edit';
import { ResponsiveLayoutWrapper } from '../../../_components/responsive-layout-wrapper';
import HeaderPortal from '../../../header-portal';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import { buildLegacyUserAndContext } from '@/auth/types';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/assistants/editor/[assistantId]'>) {
  const { assistantId } = await props.params;
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  if (!federalState.featureToggles.isNewUiDesignEnabled) {
    notFound();
  }

  const { assistant, fileMappings, pictureUrl } = await getAssistantByUser({
    assistantId: assistantId,
    schoolId: school.id,
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  const initialLinks = assistant.attachedLinks
    .filter((l) => l !== '')
    .map((url) => ({ link: url }));

  return (
    <ResponsiveLayoutWrapper>
      <HeaderPortal>
        <ToggleSidebarButton
          isNewUiDesignEnabled={federalState.featureToggles.isNewUiDesignEnabled}
        />
        <div className="grow"></div>
        <ProfileMenu userAndContext={userAndContext} />
      </HeaderPortal>
      <AssistantEdit
        assistant={assistant}
        relatedFiles={fileMappings}
        initialLinks={initialLinks}
        avatarPictureUrl={pictureUrl}
      />
    </ResponsiveLayoutWrapper>
  );
}
