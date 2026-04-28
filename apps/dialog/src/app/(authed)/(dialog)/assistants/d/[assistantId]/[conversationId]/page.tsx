import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import Chat from '@/components/chat/chat';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import Logo from '@/components/common/logo';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { convertMessageModelToMessage } from '@/utils/chat/messages';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { requireAuth } from '@/auth/requireAuth';
import { getConversationWithMessagesAndAssistant } from '@shared/assistants/assistant-service';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAvatarPictureUrl } from '@shared/files/fileService';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({ model: z.string().optional() });

export default async function Page(
  props: PageProps<'/assistants/d/[assistantId]/[conversationId]'>,
) {
  const { assistantId, conversationId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
  };

  const { conversation, messages, assistant } = await getConversationWithMessagesAndAssistant({
    conversationId: conversationId,
    assistantId: assistantId,
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  const chatMessages = convertMessageModelToMessage(messages);

  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: federalState.id,
  });

  const logoElement = <Logo logoPath={federalState.pictureUrls?.logo} />;

  const lastUsedModelInChat = messages.at(-1)?.modelName;

  const currentModel =
    searchParams.model ?? lastUsedModelInChat ?? user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

  const avatarPictureUrl = await getAvatarPictureUrl(assistant.pictureId);

  return (
    <LlmModelsProvider
      models={models}
      defaultLlmModelByCookie={currentModel}
      initialDownloadConversationEnabled={chatMessages.length > 0}
    >
      <HeaderPortal>
        <ChatHeaderBar
          chatId={conversation.id}
          title={assistant.name}
          downloadConversationEnabled={chatMessages.length > 0}
          userAndContext={userAndContext}
        />
      </HeaderPortal>
      <DefaultPageLayout>
        <Chat
          id={conversation.id}
          initialMessages={chatMessages}
          assistant={assistant}
          enableFileUpload={true}
          imageSource={avatarPictureUrl}
          logoElement={logoElement}
        />
      </DefaultPageLayout>
    </LlmModelsProvider>
  );
}
