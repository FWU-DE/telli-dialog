import Chat from '@/components/chat/chat';
import { generateUUID } from '@/utils/uuid';
import SelectLlmModel from '@/components/conversation/select-llm-model';
import { NewChatButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import DownloadConversationButton from './download-conversation-button';
import HeaderPortal from './header-portal';
import { getUser } from '@/auth/utils';
import { getRandomPromptSuggestions } from '@/utils/prompt-suggestions/utils';
import { getSignedUrlFromS3Get } from '@/s3';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const id = generateUUID();
  const user = await getUser();

  const url = await getSignedUrlFromS3Get({ key: 'alex.jpg' });
  console.debug({ url });

  const promptSuggestions = getRandomPromptSuggestions({ userRole: user.school.userRole });

  return (
    <>
      <HeaderPortal>
        <div className="flex w-full gap-4 justify-center items-center z-30">
          <ToggleSidebarButton />
          <NewChatButton />
          <SelectLlmModel />
          <div className="flex-grow"></div>
          <DownloadConversationButton conversationId={id} disabled />
          <ProfileMenu {...user} />
        </div>
      </HeaderPortal>
      <Chat key={id} id={id} initialMessages={[]} promptSuggestions={promptSuggestions} />
    </>
  );
}
