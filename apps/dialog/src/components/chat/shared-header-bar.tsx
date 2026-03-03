import useBreakpoints from '../hooks/use-breakpoints';
import { useTranslations } from 'next-intl';
import DestructiveActionButton from '../common/destructive-action-button';
import { cn } from '@/utils/tailwind';
import TrashIcon from '../icons/trash';
import { iconClassName } from '@/utils/tailwind/icon';
import DownloadSharedConversationButton from '@/app/(unauth)/ua/download-shared-conversation-button';
import Image from 'next/image';
import ProfileMenu, { ThreeDotsProfileMenu } from '../navigation/profile-menu';
import { type ChatMessage as Message } from '@/types/chat';
import { reductionBreakpoint } from '@/utils/tailwind/layout';

export function SharedChatHeader({
  chatActive,
  hasMessages,
  t,
  handleOpenNewChat,
  title,
  messages,
  imageSource,
  dialogStarted,
  inviteCode,
}: {
  chatActive: boolean;
  hasMessages: boolean;
  t: ReturnType<typeof useTranslations>;
  handleOpenNewChat: () => void;
  title: string;
  messages: Message[];
  imageSource?: string;
  dialogStarted: boolean;
  inviteCode: string;
}) {
  const { isBelow } = useBreakpoints();
  const tCommon = useTranslations('common');

  const showCompressedHeader = isBelow[reductionBreakpoint];

  const deleteChatElement = (
    <DestructiveActionButton
      modalTitle={t('delete-chat-modal-title')}
      confirmText={t('delete-chat-modal-confirm-button')}
      modalDescription={t('delete-chat-modal-description')}
      triggerButtonClassName={cn(
        'justify-center items-center focus:outline-hidden',
        iconClassName,
        isBelow.sm && 'items-center justify-start',
      )}
      actionFn={handleOpenNewChat}
    >
      <span className="flex items-center gap-1 pl-2">
        <TrashIcon className="h-8 w-8" solid={true} />
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
      <div className="grow"></div>
      {
        <span className="flex justify-start text-xl text-ellipsis truncate items-center gap-2">
          {dialogStarted && imageSource && (
            <Image
              src={imageSource ?? ''}
              alt={title}
              width={30}
              height={30}
              className="rounded-enterprise-sm"
            />
          )}
          {dialogStarted && <span className="truncate">{title}</span>}
        </span>
      }
      <div className="grow"></div>

      {!showCompressedHeader ? (
        <>
          <DownloadSharedConversationButton
            conversationMessages={messages}
            disabled={!chatActive || !hasMessages}
            sharedConversationName={title}
            showText={false}
            inviteCode={inviteCode}
          />
          <ProfileMenu userAndContext={undefined} />
        </>
      ) : (
        <ThreeDotsProfileMenu
          downloadButtonJSX={
            <DownloadSharedConversationButton
              conversationMessages={messages}
              disabled={!chatActive || !hasMessages}
              sharedConversationName={title}
              showText={true}
              inviteCode={inviteCode}
            />
          }
          deleteButtonJSX={deleteChatElement}
        />
      )}
    </header>
  );
}
