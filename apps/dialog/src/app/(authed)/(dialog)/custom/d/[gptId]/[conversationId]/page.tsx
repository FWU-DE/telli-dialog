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
import { buildLegacyUserAndContext } from '@/auth/types';
import { getConversationWithMessagesAndCustomGpt } from '@shared/custom-gpt/custom-gpt-service';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAvatarPictureUrl } from '@shared/files/fileService';

export const dynamic = 'force-dynamic';
const searchParamsSchema = z.object({ model: z.string().optional() });

export default async function Page(props: PageProps<'/custom/d/[gptId]/[conversationId]'>) {
  const params = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const { conversation, messages, customGpt } = await getConversationWithMessagesAndCustomGpt({
    conversationId: params.conversationId,
    customGptId: params.gptId,
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  const chatMessages = convertMessageModelToMessage(messages);

  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: federalState.id,
  });

  const logoElement = <Logo federalStateId={federalState.id} />;

  const lastUsedModelInChat = messages.at(messages.length - 1)?.modelName ?? undefined;

  const currentModel =
    searchParams.model ?? lastUsedModelInChat ?? user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

  const avatarPictureUrl = await getAvatarPictureUrl(customGpt.pictureId);

  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <HeaderPortal>
        <ChatHeaderBar
          chatId={conversation.id}
          title={customGpt.name}
          hasMessages={chatMessages.length > 0}
          userAndContext={userAndContext}
        />
      </HeaderPortal>
      <Chat
        id={conversation.id}
        initialMessages={chatMessages}
        customGpt={customGpt}
        enableFileUpload={true}
        imageSource={avatarPictureUrl}
        logoElement={logoElement}
      />
    </LlmModelsProvider>
  );
}
