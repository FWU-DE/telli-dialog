'use client';

import { UserAndContext } from '@/auth/types';
import SelectLlmModel from '../conversation/select-llm-model';
import { NewChatButton, ToggleSidebarButton } from '../navigation/sidebar/collapsible-sidebar';
import DownloadConversationButton from '@/app/(authed)/(dialog)/download-conversation-button';
import ProfileMenu, { ThreeDotsProfileMenu } from '../navigation/profile-menu';
import { reductionBreakpoint } from '@/utils/tailwind/layout';
import useBreakpoints from '../hooks/use-breakpoints';
import { useLlmModels } from '../providers/llm-model-provider';
import { useRegisterDialogHeader } from '../providers/dialog-header-provider';

export function ChatHeaderBar({
  userAndContext,
  title,
  downloadConversationEnabled: downloadConversationEnabledProp,
  chatId,
}: {
  userAndContext: UserAndContext;
  title?: string;
  downloadConversationEnabled: boolean;
  chatId: string;
}) {
  const { isBelow } = useBreakpoints();
  const showCompressedHeader = isBelow[reductionBreakpoint];
  const { downloadConversationEnabled: downloadConversationEnabledFromContext } = useLlmModels();
  // Either the server-provided prop or the client-side context (updated after first message sent)
  const downloadConversationEnabled =
    downloadConversationEnabledProp || downloadConversationEnabledFromContext;
  const isNewUiDesignEnabled = userAndContext.federalState.featureToggles.isNewUiDesignEnabled;

  const headerContent = (
    <div className="flex flex-col w-full">
      <div className="flex w-full gap-4 justify-center items-center">
        <ToggleSidebarButton isNewUiDesignEnabled={isNewUiDesignEnabled} />
        <NewChatButton />
        <SelectLlmModel isStudent={userAndContext.school.userRole === 'student'} />
        <div className="grow"></div>
        {title !== undefined && (
          <div className="hidden sm:flex sm:w-1/3 lg:w-1/2">
            <span className="font-normal text-xl truncate">{title}</span>
          </div>
        )}
        {!showCompressedHeader ? (
          <>
            <DownloadConversationButton
              conversationId={chatId}
              characterName={title}
              disabled={!downloadConversationEnabled}
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
                  disabled={!downloadConversationEnabled}
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
  );

  useRegisterDialogHeader(headerContent);

  return null;
}
