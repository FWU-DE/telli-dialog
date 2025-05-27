'use client';

import { UserAndContext } from '@/auth/types';
import SelectLlmModel from '../conversation/select-llm-model';
import { NewChatButton, ToggleSidebarButton } from '../navigation/sidebar/collapsible-sidebar';
import DownloadConversationButton from '@/app/(authed)/(dialog)/download-conversation-button';
import ProfileMenu from '../navigation/profile-menu';
import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';

export function ChatHeaderBar({
  user,
  title,
  chatId,
  downloadButtonDisabled,
}: {
  user: UserAndContext;
  title?: string;
  chatId: string;
  downloadButtonDisabled: boolean;
}) {
  return (
    <HeaderPortal>
      <div className="flex flex-col w-full">
        <div className="flex w-full gap-4 justify-center items-center">
          <ToggleSidebarButton />
          <NewChatButton />
          <SelectLlmModel isStudent={user.school.userRole === 'student'} />
          <div className="flex-grow"></div>
          {title !== undefined && (
            <div className="hidden sm:flex  md:w-1/2 sm:w-1/3">
              <span className="font-normal text-xl truncate">{title}</span>
            </div>
          )}

          <DownloadConversationButton
            conversationId={chatId}
            className="flex items-center text-main-900 hover:text-main-600"
            iconClassName="h-6 w-6"
            characterName={title}
            disabled={downloadButtonDisabled}
          />
          <ProfileMenu {...user} />
        </div>
        <div className="flex flex-1 w-full sm:hidden">
          <span className="font-normal text-xl">{title}</span>
        </div>
      </div>
    </HeaderPortal>
  );
}
