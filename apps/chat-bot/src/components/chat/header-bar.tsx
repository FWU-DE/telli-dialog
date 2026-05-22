'use client';

import { UserAndContext } from '@/auth/types';
import SelectLlmModel from '../conversation/select-llm-model';
import { NewChatButton } from '../navigation/sidebar/collapsible-sidebar';
import DownloadConversationButton, {
  fetchConversationDownload,
} from '@/app/(authed)/(chat-bot)/download-conversation-button';
import { downloadFileFromBlob } from '@/utils/files/blob-download';
import { useLlmModels } from '../providers/llm-model-provider';
import {
  ApplicationHeaderActions,
  type HeaderActionConfig,
} from '@/components/layout/application-header';
import { BoxArrowDownIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/common/toast';
import { useCallback } from 'react';

export type ChatHeaderBarProps = {
  userAndContext: UserAndContext;
  title?: string;
  downloadConversationEnabled: boolean;
  chatId: string;
};

export function ChatHeaderBar({
  userAndContext,
  title,
  downloadConversationEnabled: downloadConversationEnabledProp,
  chatId,
}: ChatHeaderBarProps) {
  const tCommon = useTranslations('common');
  const toast = useToast();
  const { downloadConversationEnabled: downloadConversationEnabledFromContext } = useLlmModels();
  const downloadConversationEnabled =
    downloadConversationEnabledProp || downloadConversationEnabledFromContext;

  const handleDownload = useCallback(async () => {
    if (!downloadConversationEnabled) {
      return;
    }

    try {
      const { blob, fileName } = await fetchConversationDownload({
        conversationId: chatId,
        characterName: title,
      });
      downloadFileFromBlob(blob, fileName);
    } catch {
      toast.error('Der Download der Konversation ist fehlgeschlagen.');
    }
  }, [chatId, downloadConversationEnabled, title, toast]);

  const actions: HeaderActionConfig[] = [
    {
      id: 'chat-header-main-content',
      headerNode: (
        <div className="flex flex-col w-full">
          <div className="flex w-full gap-4 justify-center items-center">
            <NewChatButton />
            <SelectLlmModel isStudent={userAndContext.userRole === 'student'} />
            <div className="grow"></div>
            {title !== undefined && (
              <div className="hidden sm:flex sm:w-1/3 lg:w-1/2">
                <span className="font-normal text-xl truncate">{title}</span>
              </div>
            )}
            <div className="hidden sm:flex">
              <DownloadConversationButton
                conversationId={chatId}
                characterName={title}
                disabled={!downloadConversationEnabled}
                showText={false}
              />
            </div>
          </div>
          <div className="flex flex-1 w-full sm:hidden">
            <span className="font-normal text-xl">{title}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'download-conversation',
      menuItem: {
        label: tCommon('conversation-download'),
        icon: <BoxArrowDownIcon />,
        disabled: !downloadConversationEnabled,
        onSelect: handleDownload,
      },
    },
  ];

  return <ApplicationHeaderActions actions={actions} />;
}
