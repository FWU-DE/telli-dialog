import { dbGetCoversationMessages, dbGetConversationById } from '@/db/functions/chat';
import { getUser } from '@/auth/utils';
import { redirect } from 'next/navigation';
import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import { z } from 'zod';
import { type Message } from 'ai';
import Chat from '@/components/chat/chat';
import { dbGetCustomGptById } from '@/db/functions/custom-gpts';
import DownloadConversationButton from '@/app/(authed)/(dialog)/download-conversation-button';
import { NewChatButton } from '@/components/navigation/sidebar/collapsible-sidebar';

export const dynamic = 'force-dynamic';

const pageContextSchema = z.object({
  params: z.object({
    gptId: z.string(),
    conversationId: z.string(),
  }),
});

async function safeParse(context: { params: Promise<{ gptId: string; conversationId: string }> }) {
  const resolvedParams = await context.params;
  const parseResult = pageContextSchema.safeParse({ params: resolvedParams });

  if (parseResult.success) {
    return parseResult.data;
  }

  redirect('/');
}

export default async function Page(context: {
  params: Promise<{ gptId: string; conversationId: string }>;
}) {
  const { params } = await safeParse(context);

  const [chat, user] = await Promise.all([dbGetConversationById(params.conversationId), getUser()]);

  if (chat === undefined) {
    throw new Error('Chat not found');
  }

  const rawChatMessages = await dbGetCoversationMessages({
    conversationId: chat.id,
    userId: user.id,
  });

  const chatMessages: Message[] = rawChatMessages.map((message) => ({
    ...message,
    role: message.role === 'tool' ? 'data' : message.role,
  }));

  const customGpt = await dbGetCustomGptById({ customGptId: params.gptId });

  if (customGpt === undefined) {
    console.warn(`GPT with id ${params.gptId} not found`);
    redirect('/');
  }

  return (
    <>
      <HeaderPortal>
        <div className="flex w-full gap-4 justify-center items-center">
          <ToggleSidebarButton />
          <NewChatButton />
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
      <Chat id={chat.id} initialMessages={chatMessages} customGpt={customGpt} />
    </>
  );
}
