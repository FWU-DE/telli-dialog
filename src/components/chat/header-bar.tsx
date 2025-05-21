import { UserAndContext } from '@/auth/types';
import SelectLlmModel from '../conversation/select-llm-model';
import { NewChatButton, ToggleSidebarButton } from '../navigation/sidebar/collapsible-sidebar';
import DownloadConversationButton from '@/app/(authed)/(dialog)/download-conversation-button';
import ProfileMenu, { UnauthenticatedProfileMenu } from '../navigation/profile-menu';
import DownloadSharedConversationButton from '@/app/(unauth)/ua/dowload-shared-conversation-button';
import { Message } from 'ai';
import DestructiveActionButton from '../common/destructive-action-button';
import TrashFilledIcon from '../icons/trash-filled';
import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { cn } from '@/utils/tailwind';
import { iconClassName } from '@/utils/tailwind/icon';

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

export function SharedChatHeader({
  chatActive,
  hasMessages,
  t,
  handleOpenNewChat,
  title,
  messages,
}: {
  chatActive: boolean;
  hasMessages: boolean;
  t: (key: string) => string;
  handleOpenNewChat: () => void;
  title: string;
  messages: Message[];
}) {
  return (
    <header className="flex gap-4 justify-between items-center py-[1.15rem] px-6">
      {chatActive && hasMessages && (
        <>
          <DestructiveActionButton
            modalTitle={t('delete-chat-modal-title')}
            confirmText={t('delete-chat-modal-confirm-button')}
            modalDescription={t('delete-chat-modal-description')}
            triggerButtonClassName={cn(
              'flex justify-center items-center w-8 h-8',
              iconClassName,
              'disabled:bg-light-gray group !px-0 !py-0 !text-current !border-0 ',
            )}
            actionFn={handleOpenNewChat}
          >
            <TrashFilledIcon className="h-4 w-4" />
          </DestructiveActionButton>
        </>
      )}

      <div className="flex-grow"></div>
      {
        <div className="flex w-1/2 justify-center">
          {hasMessages && <span className="text-xl truncate font-normal">{title}</span>}
        </div>
      }
      <div className="flex-grow"></div>
      <DownloadSharedConversationButton
        conversationMessages={messages}
        disabled={!chatActive || !hasMessages}
        sharedConversationName={title}
      />
      <UnauthenticatedProfileMenu />
    </header>
  );
}
