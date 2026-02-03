'use client';

import { UserAndContext } from '@/auth/types';
import SelectLlmModel from '../conversation/select-llm-model';
import { NewChatButton, ToggleSidebarButton } from '../navigation/sidebar/collapsible-sidebar';
import DownloadConversationButton from '@/app/(authed)/(dialog)/download-conversation-button';
import ProfileMenu, { ThreeDotsProfileMenu } from '../navigation/profile-menu';
import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { reductionBreakpoint } from '@/utils/tailwind/layout';
import useBreakpoints from '../hooks/use-breakpoints';

export function ChatHeaderBar({
  userAndContext,
  title,
  hasMessages,
  chatId,
}: {
  userAndContext: UserAndContext;
  title?: string;
  hasMessages: boolean;
  chatId: string;
}) {
  const { isBelow } = useBreakpoints();
  const showCompressedHeader = isBelow[reductionBreakpoint];

  return (
    <HeaderPortal>
      <div className="flex flex-col w-full">
        <div className="flex w-full gap-4 justify-center items-center">
          <ToggleSidebarButton />
          <NewChatButton />
          <SelectLlmModel isStudent={userAndContext.school.userRole === 'student'} />
          <div className="flex-grow"></div>
          {title !== undefined && (
            <div className="hidden sm:flex md:w-1/2 sm:w-1/3">
              <span className="font-normal text-xl truncate">{title}</span>
            </div>
          )}
          {!showCompressedHeader ? (
            <>
              <DownloadConversationButton
                conversationId={chatId}
                characterName={title}
                disabled={!hasMessages}
                showText={false}
              />
              <ProfileMenu userAndContext={userAndContext} />
            </>
          ) : (
            <>
              <ThreeDotsProfileMenu
                downloadButtonJSX={
                  <DownloadConversationButton
                    conversationId={chatId}
                    characterName={title}
                    disabled={!hasMessages}
                    showText={true}
                  />
                }
                userAndContext={userAndContext}
              />
            </>
          )}
        </div>
        <div className="flex flex-1 w-full sm:hidden">
          <span className="font-normal text-xl">{title}</span>
        </div>
      </div>
    </HeaderPortal>
  );
}
