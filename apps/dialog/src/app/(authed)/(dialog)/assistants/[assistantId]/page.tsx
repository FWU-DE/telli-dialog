import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAssistantByUser } from '@shared/assistants/assistant-service';
import { notFound } from 'next/navigation';
import { AssistantView } from './assistant-view';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/assistants/[assistantId]'>) {
  const { assistantId } = await props.params;
  const { user, school, federalState } = await requireAuth();

  if (!federalState.featureToggles.isNewUiDesignEnabled) {
    notFound();
  }

  const { assistant, fileMappings, pictureUrl } = await getAssistantByUser({
    assistantId: assistantId,
    schoolId: school.id,
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  return (
    <AssistantView assistant={assistant} fileMappings={fileMappings} pictureUrl={pictureUrl} />
  );
}
