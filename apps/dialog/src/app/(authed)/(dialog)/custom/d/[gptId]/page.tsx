import { generateUUID } from '@shared/utils/uuid';
import Chat from '@/components/chat/chat';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import Logo from '@/components/common/logo';
import { getAssistantForNewChat } from '@shared/assistants/assistant-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAvatarPictureUrl } from '@shared/files/fileService';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/custom/d/[gptId]'>) {
  const { gptId } = await props.params;
  const id = generateUUID();
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const assistant = await getAssistantForNewChat({
    assistantId: gptId,
    userId: user.id,
    schoolId: school.id,
  }).catch(handleErrorInServerComponent);

  const logoElement = <Logo federalStateId={federalState.id} />;
  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: federalState.id,
  });

  const currentModel = user.lastUsedModel ?? DEFAULT_CHAT_MODEL;
  const avatarPictureUrl = await getAvatarPictureUrl(assistant.pictureId);

  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <ChatHeaderBar chatId={id} userAndContext={userAndContext} hasMessages={false} />
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        assistant={assistant}
        enableFileUpload={true}
        promptSuggestions={assistant.promptSuggestions}
        imageSource={avatarPictureUrl}
        logoElement={logoElement}
      />
    </LlmModelsProvider>
  );
}
