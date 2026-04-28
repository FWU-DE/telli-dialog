import { generateUUID } from '@shared/utils/uuid';
import Chat from '@/components/chat/chat';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import Logo from '@/components/common/logo';
import { getAssistantForNewChat } from '@shared/assistants/assistant-service';
import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAvatarPictureUrl } from '@shared/files/fileService';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import { ChatHeaderBar } from '@/components/chat/header-bar';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/assistants/d/[assistantId]'>) {
  const { assistantId } = await props.params;
  const id = generateUUID();
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
  };

  const assistant = await getAssistantForNewChat({
    assistantId: assistantId,
    userId: user.id,
    schoolIds: user.schoolIds ?? [],
  }).catch(handleErrorInServerComponent);

  const logoElement = <Logo logoPath={federalState.pictureUrls?.logo} />;
  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: federalState.id,
  });

  const currentModel = user.lastUsedModel ?? DEFAULT_CHAT_MODEL;
  const avatarPictureUrl = await getAvatarPictureUrl(assistant.pictureId);

  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <ChatHeaderBar
        chatId={id}
        userAndContext={userAndContext}
        downloadConversationEnabled={false}
      />
      <DefaultPageLayout>
        <Chat
          id={id}
          initialMessages={[]}
          assistant={assistant}
          enableFileUpload={true}
          promptSuggestions={assistant.promptSuggestions}
          imageSource={avatarPictureUrl}
          logoElement={logoElement}
        />
      </DefaultPageLayout>
    </LlmModelsProvider>
  );
}
