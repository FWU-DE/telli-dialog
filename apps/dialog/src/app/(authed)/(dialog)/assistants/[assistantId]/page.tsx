import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAssistantForEditView } from '@shared/assistants/assistant-service';
import { notFound } from 'next/navigation';
import { AssistantView } from './assistant-view';
import { getAvatarPictureUrl } from '@shared/files/fileService';

export const dynamic = 'force-dynamic';

/* View component will be handled in TD-697 */
export default async function Page(props: PageProps<'/assistants/[assistantId]'>) {
  const { assistantId } = await props.params;
  const { user, school, federalState } = await requireAuth();

  if (!federalState.featureToggles.isNewUiDesignEnabled) {
    notFound();
  }

  // Todo: getAssistantForReadOnlyView
  const assistant = await getAssistantForEditView({
    assistantId: assistantId,
    schoolId: school.id,
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  const pictureUrl = await getAvatarPictureUrl(assistant.pictureId);

  return <AssistantView assistant={assistant} pictureUrl={pictureUrl} />;
}
