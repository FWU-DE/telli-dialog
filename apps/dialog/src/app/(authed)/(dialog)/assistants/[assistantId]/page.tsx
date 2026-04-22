import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAssistantByUser } from '@shared/assistants/assistant-service';
import { AssistantView } from './assistant-view';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import { buildLegacyUserAndContext } from '@/auth/types';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/assistants/[assistantId]'>) {
  const { assistantId } = await props.params;
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const { assistant, fileMappings, pictureUrl } = await getAssistantByUser({
    assistantId: assistantId,
    schoolId: school.id,
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  return (
    <DefaultPageLayout>
      <CustomChatHeader userAndContext={userAndContext} />
      <AssistantView assistant={assistant} fileMappings={fileMappings} pictureUrl={pictureUrl} />
    </DefaultPageLayout>
  );
}
