'use client';

import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import StopWatchDoneIcon from '@/components/icons/stopwatch-done';
import DownloadSharedConversationButton from '@/app/(unauth)/ua/dowload-shared-conversation-button';
import { type ChatMessage as Message } from '@/types/chat';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/hooks/use-theme';
import { constructRootLayoutStyle } from '@/utils/tailwind/layout';

type ExpiredChatModalProps = {
  conversationMessages: Message[];
  title: string;
};

export default function ExpiredChatModal({ conversationMessages, title }: ExpiredChatModalProps) {
  const t = useTranslations('learning-scenarios.shared');
  const { designConfiguration } = useTheme();
  return (
    <AlertDialog.Root open={true}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-dark-gray z-30 opacity-30 shadow-[0px_0px_80px_0px_rgba(0,41,102,0.1)]" />
        <AlertDialog.Content
          className="z-50 fixed left-1/2 top-1/2 max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-enterprise-md bg-white p-10 w-[350px] lg:w-[564px] max-w-xl"
          style={constructRootLayoutStyle({ designConfiguration })}
        >
          <div className="flex flex-col justify-center items-center gap-4">
            <AlertDialog.Title asChild>
              <h1 className="text-3xl font-medium">
                <StopWatchDoneIcon className="text-dark-red" />
              </h1>
            </AlertDialog.Title>
            <AlertDialog.Description asChild>
              <p className="text-3xl w-full text-center">{t('expired-modal-description')}</p>
            </AlertDialog.Description>
            <AlertDialog.Action asChild>
              <div className="mt-6 mb-2">
                <DownloadSharedConversationButton
                  primaryButton
                  characterName={title}
                  conversationMessages={conversationMessages}
                  disabled={conversationMessages.length === 0}
                />
              </div>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
