'use client';

import useBreakpoints from '../hooks/use-breakpoints';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/tailwind';
import DownloadSharedConversationButton from '@/app/(unauth)/ua/download-shared-conversation-button';
import Image from 'next/image';
import ProfileMenu, { ThreeDotsProfileMenu } from '../navigation/profile-menu';
import { type ChatMessage as Message } from '@/types/chat';
import { reductionBreakpoint } from '@/utils/tailwind/layout';
import { ConfirmAlertDialog, useConfirmAlertDialog } from '@ui/components/alert-dialog';
import { Button } from '@ui/components/button';
import { TrashSimpleIcon } from '@phosphor-icons/react';

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
  const { dialogProps: deleteDialogProps, confirm: confirmDelete } = useConfirmAlertDialog();

  const showCompactHeader = isBelow[reductionBreakpoint];

  const openDeleteConfirm = () => confirmDelete(handleOpenNewChat);

  return (
    <header
      className={cn(
        'flex gap-4 justify-between items-center py-[1.15rem] px-2',
        isBelow[reductionBreakpoint] && 'justify-start',
      )}
    >
      {!showCompactHeader && (
        <Button
          variant="ghost"
          size="icon-round"
          className="text-primary"
          onClick={openDeleteConfirm}
          data-testid="custom-chat-delete-button"
        >
          <TrashSimpleIcon className="size-5 text-primary" />
        </Button>
      )}
      <div className="grow"></div>
      <span className="flex justify-start text-xl text-ellipsis truncate items-center gap-2">
        {dialogStarted && imageSource && (
          <Image
            src={imageSource ?? ''}
            alt={title}
            width={30}
            height={30}
            className="rounded-enterprise-sm"
            unoptimized
          />
        )}
        {dialogStarted && <span className="truncate">{title}</span>}
      </span>
      <div className="grow"></div>

      {!showCompactHeader ? (
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
          deleteButtonJSX={
            <Button
              variant="ghost"
              onClick={openDeleteConfirm}
              data-testid="custom-chat-delete-button"
            >
              <TrashSimpleIcon className="size-5 text-primary" />
              {tCommon('delete')}
            </Button>
          }
        />
      )}
      <ConfirmAlertDialog
        title={t('delete-chat-modal-title')}
        description={t('delete-chat-modal-description')}
        confirmLabel={t('delete-chat-modal-confirm-button')}
        cancelLabel={tCommon('cancel')}
        {...deleteDialogProps}
      />
    </header>
  );
}
