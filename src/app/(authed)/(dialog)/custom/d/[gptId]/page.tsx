import { generateUUID } from '@/utils/uuid';
import { getUser } from '@/auth/utils';
import { redirect } from 'next/navigation';
import Chat from '@/components/chat/chat';
import { dbGetCustomGptById } from '@/db/functions/custom-gpts';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetAndUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import Logo from '@/components/common/logo';
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ gptId: string }> }) {
  const gptId = (await params).gptId;
  const id = generateUUID();
  const user = await getUser();

  const customGpt = await dbGetCustomGptById({
    customGptId: gptId,
  });

  if (customGpt === undefined) {
    console.error(`GPT with id ${customGpt} not found`);
    redirect('/');
  }
  const logoElement = <Logo federalStateId={user.federalState.id} />;
  const models = await dbGetAndUpdateLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  const currentModel = user.lastUsedModel ?? DEFAULT_CHAT_MODEL;
  const maybeSignedImageUrl = await getMaybeSignedUrlFromS3Get({ key: customGpt.pictureId });
  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <ChatHeaderBar chatId={id} user={user} downloadButtonDisabled={true} />
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        customGpt={customGpt}
        enableFileUpload={false}
        promptSuggestions={customGpt.promptSuggestions}
        imageSource={maybeSignedImageUrl}
        logoElement={logoElement}
      />
    </LlmModelsProvider>
  );
}
