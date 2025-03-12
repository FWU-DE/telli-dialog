import { generateUUID } from '@/utils/uuid';
import { NewChatButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import DownloadConversationButton from '../../../download-conversation-button';
import HeaderPortal from '../../../header-portal';
import { getUser } from '@/auth/utils';
import { redirect } from 'next/navigation';
import Chat from '@/components/chat/chat';
import { dbGetCustomGptById } from '@/db/functions/custom-gpts';

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

  return (
    <>
      <HeaderPortal>
        <div className="flex w-full gap-4 justify-center items-center z-30">
          <ToggleSidebarButton />
          <NewChatButton />
          <span className="font-normal text-xl">{customGpt.name}</span>
          <div className="flex-grow"></div>
          <DownloadConversationButton conversationId={id} characterName={customGpt.name} disabled />
          <ProfileMenu {...user} />
        </div>
      </HeaderPortal>
      <Chat key={id} id={id} initialMessages={[]} customGpt={customGpt} />
    </>
  );
}
