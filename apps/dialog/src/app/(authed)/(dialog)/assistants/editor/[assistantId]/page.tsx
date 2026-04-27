import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAssistantByUser } from '@shared/assistants/assistant-service';
import { AssistantEdit } from './assistant-edit';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/assistants/editor/[assistantId]'>) {
  const { assistantId } = await props.params;
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
    hasApiKeyAssigned: federalState.hasApiKeyAssigned,
  };

  const { assistant, fileMappings, pictureUrl } = await getAssistantByUser({
    assistantId: assistantId,
    schoolIds: user.schoolIds ?? [],
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  const initialLinks = assistant.attachedLinks
    .filter((l) => l !== '')
    .map((url) => ({ link: url }));

  return (
    <DefaultPageLayout userAndContext={userAndContext}>
      <AssistantEdit
        assistant={assistant}
        relatedFiles={fileMappings}
        initialLinks={initialLinks}
        avatarPictureUrl={pictureUrl}
      />
    </DefaultPageLayout>
  );
}
