import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAssistantForEditView, getFileMappings } from '@shared/assistants/assistant-service';
import { notFound } from 'next/navigation';
import { AssistantEdit } from './assistant-edit';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/assistants/[assistantId]/edit'>) {
  const { assistantId } = await props.params;
  const { user, school, federalState } = await requireAuth();

  if (!federalState.featureToggles.isNewUiDesignEnabled) {
    notFound();
  }

  const [assistant, relatedFiles] = await Promise.all([
    getAssistantForEditView({
      assistantId: assistantId,
      schoolId: school.id,
      userId: user.id,
    }),
    getFileMappings({
      assistantId: assistantId,
      userId: user.id,
      schoolId: school.id,
    }),
  ]).catch(handleErrorInServerComponent);

  const initialLinks = assistant.attachedLinks
    .filter((l) => l !== '')
    .map((url) => ({ link: url }));

  return (
    <AssistantEdit assistant={assistant} relatedFiles={relatedFiles} initialLinks={initialLinks} />
  );
}
