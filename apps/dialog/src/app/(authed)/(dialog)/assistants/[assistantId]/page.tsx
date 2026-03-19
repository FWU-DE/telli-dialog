import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getCustomGptForEditView } from '@shared/custom-gpt/custom-gpt-service';
import { notFound } from 'next/navigation';
import { AssistantView } from './assistant-view';

export const dynamic = 'force-dynamic';

/* View component will be handled in TD-697 */
export default async function Page(props: PageProps<'/assistants/[assistantId]'>) {
  const { assistantId } = await props.params;
  const { user, school, federalState } = await requireAuth();

  if (!federalState.featureToggles.isNewUiDesignEnabled) {
    notFound();
  }

  const assistant = await getCustomGptForEditView({
    customGptId: assistantId,
    schoolId: school.id,
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  return <AssistantView assistant={assistant}></AssistantView>;
}
