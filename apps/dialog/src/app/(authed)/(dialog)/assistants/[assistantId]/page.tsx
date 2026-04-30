import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAssistantByUser } from '@shared/assistants/assistant-service';
import { AssistantView } from './assistant-view';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/assistants/[assistantId]'>) {
  const { assistantId } = await props.params;
  const { user } = await requireAuth();

  const { assistant, fileMappings, pictureUrl } = await getAssistantByUser({
    assistantId: assistantId,
    schoolIds: user.schoolIds ?? [],
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  return (
    <DefaultPageLayout>
      <AssistantView assistant={assistant} fileMappings={fileMappings} pictureUrl={pictureUrl} />
    </DefaultPageLayout>
  );
}
