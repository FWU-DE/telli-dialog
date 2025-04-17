import DownloadConversationButton from '@/app/(authed)/(dialog)/download-conversation-button';
import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { getUser } from '@/auth/utils';
import Chat from '@/components/chat/chat';
import SelectLlmModel from '@/components/conversation/select-llm-model';
import ProfileMenu from '@/components/navigation/profile-menu';
import {
  NewChatButton,
  ToggleSidebarButton,
} from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetCharacterByIdWithShareData } from '@/db/functions/character';
import { dbGetConversationById, dbGetCoversationMessages } from '@/db/functions/chat';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { type Message } from 'ai';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const pageContextSchema = z.object({
  params: z.object({
    characterId: z.string(),
    conversationId: z.string(),
  }),
});

export default async function Page(context: PageContext) {
  const result = pageContextSchema.safeParse(await awaitPageContext(context));
  if (!result.success) redirect('/');
  const params = result.data.params;
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

  const character = await dbGetCharacterByIdWithShareData({
    characterId: params.characterId,
    userId: user.id,
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
          <NewChatButton />
          <SelectLlmModel isStudent={user.school.userRole === 'student'} />
          <div className="flex-grow"></div>
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
      <Chat
        id={chat.id}
        initialMessages={chatMessages}
        character={character}
        enableFileUpload={false}
      />
    </>
  );
}
