import { dbGetCoversationMessages, dbGetConversationById } from '@/db/functions/chat';
import { getUser } from '@/auth/utils';
import { redirect } from 'next/navigation';
import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ChatToggleButton from '@/components/navigation/new-chat-toggle-button';
import ProfileMenu from '@/components/navigation/profile-menu';
import DownloadConversationButton from '@/app/(authed)/(dialog)/download-conversation-button';
import { z } from 'zod';
import { dbGetCharacterByIdOrSchoolId } from '@/db/functions/character';
import SelectLlmModel from '@/components/conversation/select-llm-model';
import { type Message } from 'ai';
import Chat from '@/components/chat/chat';

export const dynamic = 'force-dynamic';

const pageContextSchema = z.object({
  params: z.object({
    characterId: z.string(),
    conversationId: z.string(),
  }),
});

async function safeParse(context: {
  params: Promise<{ characterId: string; conversationId: string }>;
}) {
  const resolvedParams = await context.params;
  const parseResult = pageContextSchema.safeParse({ params: resolvedParams });

  if (parseResult.success) {
    return parseResult.data;
  }

  redirect('/');
}

export default async function Page(context: {
  params: Promise<{ characterId: string; conversationId: string }>;
}) {
  const { params } = await safeParse(context);

  const [chat, user] = await Promise.all([dbGetConversationById(params.conversationId), getUser()]);

  if (!chat) {
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

  const character = await dbGetCharacterByIdOrSchoolId({
    characterId: params.characterId,
    userId: user.id,
    schoolId: user.school?.id ?? null,
  });

  if (character === undefined) {
    console.warn(`GPT with id ${params.characterId} not found`);
    redirect('/');
  }

  return (
    <>
      <HeaderPortal>
        <div className="flex w-full gap-4 justify-center items-center">
          <ToggleSidebarButton />
          <SelectLlmModel />
          <div className="flex-grow"></div>
          <ChatToggleButton />
          <DownloadConversationButton
            conversationId={chat.id}
            className="flex items-center text-main-900 hover:text-main-600"
            iconClassName="h-6 w-6"
            characterName={character.name}
            disabled={false}
          />
          <ProfileMenu {...user} />
        </div>
      </HeaderPortal>
      <Chat id={chat.id} initialMessages={chatMessages} character={character} />
    </>
  );
}
