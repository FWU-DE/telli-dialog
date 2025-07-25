import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { getUser } from '@/auth/utils';
import Chat from '@/components/chat/chat';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import Logo from '@/components/common/logo';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetConversationById, dbGetCoversationMessages } from '@/db/functions/chat';
import { dbGetCustomGptById } from '@/db/functions/custom-gpts';
import { dbGetAndUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { type Message } from 'ai';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const pageContextSchema = z.object({
  params: z.object({
    gptId: z.string(),
    conversationId: z.string(),
  }),

  searchParams: z.object({ model: z.string().optional() }).optional(),
});

export default async function Page(context: PageContext) {
  const result = pageContextSchema.safeParse(await awaitPageContext(context));
  if (!result.success) redirect('/');

  const { params, searchParams } = result.data;

  const [chat, user] = await Promise.all([dbGetConversationById(params.conversationId), getUser()]);

  if (chat === undefined) {
    throw new Error('Chat not found');
  }

  const rawChatMessages = await dbGetCoversationMessages({
    conversationId: chat.id,
    userId: user.id,
  });
  if (rawChatMessages === undefined) {
    throw new Error('no Chat messages found');
  }

  const chatMessages: Message[] = rawChatMessages.map((message) => ({
    ...message,
    role: message.role === 'tool' ? 'data' : message.role,
  }));

  const customGpt = await dbGetCustomGptById({ customGptId: params.gptId });

  if (customGpt === undefined) {
    console.warn(`GPT with id ${params.gptId} not found`);
    redirect('/');
  }

  const models = await dbGetAndUpdateLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  const logoElement = <Logo federalStateId={user.federalState.id} />;

  const lastUsedModelInChat =
    rawChatMessages.at(rawChatMessages.length - 1)?.modelName ?? undefined;

  const currentModel =
    searchParams?.model ?? lastUsedModelInChat ?? user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

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
