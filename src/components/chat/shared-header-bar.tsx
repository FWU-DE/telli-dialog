import { breakpoints } from "../hooks/use-breakpoints";

import { Message } from "@ai-sdk/react";
import useBreakpoints from "../hooks/use-breakpoints";
import { useTranslations } from "next-intl";
import DestructiveActionButton from "../common/destructive-action-button";
import { cn } from '@/utils/tailwind';
import TrashIcon from '../icons/trash';
import { iconClassName } from '@/utils/tailwind/icon';
import DownloadSharedConversationButton from "@/app/(unauth)/ua/dowload-shared-conversation-button";
import Image from "next/image";
import { ThreeDotsProfileMenu } from "../navigation/profile-menu";
import { UnauthenticatedProfileMenu } from "../navigation/profile-menu";

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
    const showCompressedHeader = isBelow[reductionBreakpoint];
  
    const deleteChatElement = (
      <DestructiveActionButton
        modalTitle={t('delete-chat-modal-title')}
        confirmText={t('delete-chat-modal-confirm-button')}
        modalDescription={t('delete-chat-modal-description')}
        triggerButtonClassName={cn(
          'justify-center items-center',
          iconClassName,
          isBelow.sm && 'items-center justify-start',
        )}
        actionFn={handleOpenNewChat}
      >
        <span className="flex items-center gap-1">
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
            buttonClassName={cn(showCompressedHeader && 'w-full items-center justify-start')}
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
                showText={true}
                buttonClassName={cn(showCompressedHeader && 'w-full items-center justify-start')}
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
  