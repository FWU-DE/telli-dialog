import DownloadConversationButton from '@/app/(authed)/(dialog)/download-conversation-button';
import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { getUser } from '@/auth/utils';
import Chat from '@/components/chat/chat';
import SelectLlmModel from '@/components/conversation/select-llm-model';
import ProfileMenu from '@/components/navigation/profile-menu';
import {
  NewChatButton,
  ToggleSidebarButton,
} from '@/components/navigation/sidebar/collapsible-sidebar';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetConversationById, dbGetCoversationMessages } from '@/db/functions/chat';
import { dbGetCustomGptById } from '@/db/functions/custom-gpts';
import { dbGetAndUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';
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

  const lastUsedModelInChat =
    rawChatMessages.at(rawChatMessages.length - 1)?.modelName ?? undefined;

  const currentModel =
    searchParams?.model ?? lastUsedModelInChat ?? user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <HeaderPortal>
        <div className="flex w-full gap-4 justify-center items-center">
          <ToggleSidebarButton />
          <NewChatButton />
          <SelectLlmModel isStudent={user.school.userRole === 'student'} />
          <span className="font-normal text-xl">{customGpt.name}</span>
          <div className="flex-grow"></div>
          <DownloadConversationButton
            conversationId={chat.id}
            className="flex items-center text-main-900 hover:text-main-600"
            iconClassName="h-6 w-6"
            characterName={customGpt.name}
            disabled={false}
          />
          <ProfileMenu {...user} />
        </div>
      </HeaderPortal>
      <Chat
        id={chat.id}
        initialMessages={chatMessages}
        customGpt={customGpt}
        enableFileUpload={false}
      />
    </LlmModelsProvider>
  );
}
