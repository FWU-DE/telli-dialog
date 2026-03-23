import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getCustomGptForEditView, getFileMappings } from '@shared/custom-gpt/custom-gpt-service';
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
    getCustomGptForEditView({
      customGptId: assistantId,
      schoolId: school.id,
      userId: user.id,
    }),
    getFileMappings({
      customGptId: assistantId,
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
