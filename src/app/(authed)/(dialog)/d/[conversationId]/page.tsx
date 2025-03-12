import Chat from '@/components/chat/chat';
import { dbGetConversationAndMessages } from '@/db/functions/chat';
import { getUser } from '@/auth/utils';
import SelectLlmModel from '@/components/conversation/select-llm-model';
import { NewChatButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import DownloadConversationButton from '../../download-conversation-button';
import HeaderPortal from '../../header-portal';
import { convertMessageModelToMessage } from '@/utils/chat/messages';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ conversationId: string }> }) {
  const id = (await params).conversationId;
  const user = await getUser();

  const conversationObject = await dbGetConversationAndMessages({
    conversationId: id,
    userId: user.id,
  });

  if (conversationObject === undefined) {
    redirect('/');
  }

  const { conversation, messages } = conversationObject;

  return (
    <>
      <HeaderPortal>
        <div className="flex w-full gap-4 justify-center items-center z-30">
          <ToggleSidebarButton />
          <NewChatButton />
          <SelectLlmModel isStudent={user.school.userRole === 'student'} />
          <div className="flex-grow"></div>
          <DownloadConversationButton conversationId={conversation.id} disabled={false} />
          <ProfileMenu {...user} />
        </div>
      </HeaderPortal>
      <Chat id={conversation.id} initialMessages={convertMessageModelToMessage(messages)} />
    </>
  );
}
