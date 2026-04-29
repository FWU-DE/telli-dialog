'use client';

import React from 'react';
import StopWatchDoneIcon from '@/components/icons/stopwatch-done';
import DownloadSharedConversationButton from '@/app/(unauth)/ua/download-shared-conversation-button';
import { type ChatMessage as Message } from '@/types/chat';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ui/components/AlertDialog';

type ExpiredChatModalProps = {
  conversationMessages: Message[];
  title: string;
  inviteCode: string;
};

export default function ExpiredChatModal({
  conversationMessages,
  title,
  inviteCode,
}: ExpiredChatModalProps) {
  const t = useTranslations('learning-scenarios.shared');
  const hasUserMessages = conversationMessages.some((message) => message.role === 'user');

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <StopWatchDoneIcon className="text-dark-red" />
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription className="text-3xl w-full text-center">
          {t('expired-modal-description')}
        </AlertDialogDescription>
        <AlertDialogFooter className="items-center sm:justify-center">
          {/* If the shared chat has expired, the messages are gone, so there is no way atm to download the conversation. */}
          {hasUserMessages && (
            <AlertDialogAction asChild>
              <DownloadSharedConversationButton
                primaryButton
                characterName={title}
                conversationMessages={conversationMessages}
                disabled={false}
                inviteCode={inviteCode}
              />
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
