import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { getUser } from '@/auth/utils';
import Chat from '@/components/chat/chat';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import Logo from '@/components/common/logo';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetConversationById, dbGetCoversationMessages } from '@shared/db/functions/chat';
import { dbGetCustomGptById } from '@shared/db/functions/custom-gpts';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { notFound, redirect } from 'next/navigation';
import { convertMessageModelToMessage } from '@/utils/chat/messages';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';

export const dynamic = 'force-dynamic';
const searchParamsSchema = z.object({ model: z.string().optional() });

export default async function Page(props: PageProps<'/custom/d/[gptId]/[conversationId]'>) {
  const params = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);

  const [chat, user] = await Promise.all([dbGetConversationById(params.conversationId), getUser()]);

  if (chat === undefined) {
    notFound();
  }

  const rawChatMessages = await dbGetCoversationMessages({
    conversationId: chat.id,
    userId: user.id,
  });
  if (rawChatMessages === undefined) {
    throw new Error('no Chat messages found');
  }

  const chatMessages = convertMessageModelToMessage(rawChatMessages);

  const customGpt = await dbGetCustomGptById({ customGptId: params.gptId });

  if (customGpt === undefined) {
    console.warn(`GPT with id ${params.gptId} not found`);
    redirect('/');
  }

  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  const logoElement = <Logo federalStateId={user.federalState.id} />;

  const lastUsedModelInChat =
    rawChatMessages.at(rawChatMessages.length - 1)?.modelName ?? undefined;

  const currentModel =
    searchParams.model ?? lastUsedModelInChat ?? user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

  const maybeSignedImageUrl = await getMaybeSignedUrlFromS3Get({ key: customGpt.pictureId });

  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <HeaderPortal>
        <ChatHeaderBar
          chatId={chat.id}
          title={customGpt.name}
          user={user}
          downloadButtonDisabled={false}
        />
      </HeaderPortal>
      <Chat
        id={chat.id}
        initialMessages={chatMessages}
        customGpt={customGpt}
        enableFileUpload={false}
        imageSource={maybeSignedImageUrl}
        logoElement={logoElement}
      />
    </LlmModelsProvider>
  );
}
