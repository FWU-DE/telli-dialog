import Chat from '@/components/chat/chat';
import { dbGetConversationAndMessages } from '@/db/functions/chat';
import { getUser } from '@/auth/utils';
import SelectLlmModel from '@/components/conversation/select-llm-model';
import { NewChatButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import DownloadConversationButton from '../../download-conversation-button';
import HeaderPortal from '../../header-portal';
import { convertMessageModelToMessage } from '@/utils/chat/messages';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetAndUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { dbGetRelatedFiles } from '@/db/functions/files';

export const dynamic = 'force-dynamic';

const pageContext = z.object({
  params: z.object({ conversationId: z.string() }),
  searchParams: z.object({ model: z.string().optional() }).optional(),
});

export default async function Page(context: PageContext) {
  const {
    params: { conversationId },
    searchParams,
  } = pageContext.parse(await awaitPageContext(context));

  const user = await getUser();

  const conversationObject = await dbGetConversationAndMessages({
    conversationId,
    userId: user.id,
  });

  if (conversationObject === undefined) {
    redirect('/');
  }
  const fileMapping = await dbGetRelatedFiles(conversationId)
  const refetchFileMapping = async () => await dbGetRelatedFiles(conversationId)
  const { conversation, messages } = conversationObject;

  const models = await dbGetAndUpdateLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  const lastUsedModelInChat = messages.at(messages.length - 1)?.modelName ?? undefined;

  const currentModel =
    searchParams?.model ?? lastUsedModelInChat ?? user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <HeaderPortal>
        <div className="flex w-full gap-4 justify-center items-center z-30">
          <ToggleSidebarButton />
          <NewChatButton />
          <SelectLlmModel
            isStudent={user.school.userRole === 'student'}
            predefinedModel={currentModel}
          />
          <div className="flex-grow"></div>
          <DownloadConversationButton conversationId={conversation.id} disabled={false} />
          <ProfileMenu {...user} />
        </div>
      </HeaderPortal>
      <Chat id={conversation.id} initialMessages={convertMessageModelToMessage(messages)} fileMapping={fileMapping}/>
    </LlmModelsProvider>
  );
}
