'use client';

import { UserAndContext } from '@/auth/types';
import SelectLlmModel from '../conversation/select-llm-model';
import { NewChatButton, ToggleSidebarButton } from '../navigation/sidebar/collapsible-sidebar';
import DownloadConversationButton from '@/app/(authed)/(dialog)/download-conversation-button';
import ProfileMenu, { UnauthenticatedProfileMenu } from '../navigation/profile-menu';
import DownloadSharedConversationButton from '@/app/(unauth)/ua/dowload-shared-conversation-button';
import { Message } from 'ai';
import DestructiveActionButton from '../common/destructive-action-button';
import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { ThreeDotsProfileMenu } from '../navigation/profile-menu';
import Image from 'next/image';
import { cn } from '@/utils/tailwind';
import TrashFilledIcon from '../icons/trash-filled';

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
  imageSource,
  reductionBreakpoint = 'sm',
}: {
  chatActive: boolean;
  hasMessages: boolean;
  t: (key: string) => string;
  handleOpenNewChat: () => void;
  title: string;
  messages: Message[];
  imageSource?: string;
  reductionBreakpoint?: keyof typeof breakpoints;
}) {
  const { isBelow } = useBreakpoints();
  const tCommon = useTranslations('common');

  const handleDownload = () => {
    // Trigger download functionality
    const downloadButton = document.querySelector('[data-download-button]');
    if (downloadButton instanceof HTMLElement) {
      downloadButton.click();
    }
  };
  console.log(isBelow.sm);
  const showCompressedHeader = isBelow[reductionBreakpoint];

  const deleteChatElement = (
    <DestructiveActionButton
      modalTitle={t('delete-chat-modal-title')}
      confirmText={t('delete-chat-modal-confirm-button')}
      modalDescription={t('delete-chat-modal-description')}
      triggerButtonClassName={cn(
        'justify-center items-center disabled:bg-light-gray disabled:text-gray-100 text-current !border-0 !rounded-enterprise-sm hover:!bg-vidis-hover-green/20',
        isBelow.sm && 'items-center justify-start',
      )}
      actionFn={handleOpenNewChat}
    >
      <span className="flex items-center gap-2">
        <TrashFilledIcon className="text-primary h-4 w-4" />
        {showCompressedHeader ? tCommon('delete') : ''}
      </span>
    </DestructiveActionButton>
  );

  return (
    <header
      className={cn(
        'flex gap-4 justify-between items-center py-[1.15rem] px-2',
        isBelow[reductionBreakpoint] && 'justify-start',
      )}
    >
      {!showCompressedHeader && deleteChatElement}
      <div className="flex-grow"></div>
      {
        <span className="flex justify-start text-xl overflow-ellipsis truncate items-center gap-2">
          {hasMessages && imageSource && (
            <Image
              src={imageSource ?? ''}
              alt={title}
              width={30}
              height={30}
              className="rounded-enterprise-sm"
            />
          )}
          {hasMessages && <span className="truncate">{title}</span>}
        </span>
      }
      <div className="flex-grow"></div>

      {!showCompressedHeader && (
        <DownloadSharedConversationButton
          conversationMessages={messages}
          disabled={!chatActive || !hasMessages}
          sharedConversationName={title}
          showText={false}
          buttonClassName={cn(showCompressedHeader && 'ml-2 w-full items-center justify-start')}
        />
      )}

      {showCompressedHeader ? (
        <ThreeDotsProfileMenu
          onDelete={chatActive && hasMessages ? handleOpenNewChat : undefined}
          onDownload={chatActive && hasMessages ? handleDownload : undefined}
          chatActive={chatActive}
          hasMessages={hasMessages}
          downloadButtonJSX={
            <DownloadSharedConversationButton
              conversationMessages={messages}
              disabled={!chatActive || !hasMessages}
              sharedConversationName={title}
              showText={false}
              buttonClassName={cn(showCompressedHeader && 'ml-2 w-full items-center justify-start')}
            />
          }
          deleteButtonJSX={deleteChatElement}
        />
      ) : (
        <UnauthenticatedProfileMenu />
      )}
    </header>
  );
}
