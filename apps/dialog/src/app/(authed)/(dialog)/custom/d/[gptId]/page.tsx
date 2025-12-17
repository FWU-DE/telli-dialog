import { generateUUID } from '@shared/utils/uuid';
import Chat from '@/components/chat/chat';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import Logo from '@/components/common/logo';
import { getCustomGptForNewChat } from '@shared/custom-gpt/custom-gpt-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { handleErrorInServerComponent } from '@shared/error/handle-error-in-server-component';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/custom/d/[gptId]'>) {
  const { gptId } = await props.params;
  const id = generateUUID();
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const customGpt = await getCustomGptForNewChat({
    customGptId: gptId,
    userId: user.id,
    schoolId: school.id,
  }).catch(handleErrorInServerComponent);

  const logoElement = <Logo federalStateId={federalState.id} />;
  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: federalState.id,
  });

  const currentModel = user.lastUsedModel ?? DEFAULT_CHAT_MODEL;
  const maybeSignedImageUrl = await getMaybeSignedUrlFromS3Get({ key: customGpt.pictureId });
  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <ChatHeaderBar chatId={id} user={userAndContext} downloadButtonDisabled={true} />
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        customGpt={customGpt}
        enableFileUpload={true}
        promptSuggestions={customGpt.promptSuggestions}
        imageSource={maybeSignedImageUrl}
        logoElement={logoElement}
      />
    </LlmModelsProvider>
  );
}
