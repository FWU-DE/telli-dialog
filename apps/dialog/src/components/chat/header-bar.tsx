'use client';

import { UserAndContext } from '@/auth/types';
import SelectLlmModel from '../conversation/select-llm-model';
import { NewChatButton } from '../navigation/sidebar/collapsible-sidebar';
import DownloadConversationButton from '@/app/(authed)/(dialog)/download-conversation-button';
import { useLlmModels } from '../providers/llm-model-provider';
import {
  DialogHeaderContent,
  DialogHeaderCompactMenuContent,
} from '@/components/layout/dialog-header';

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
  const { downloadConversationEnabled: downloadConversationEnabledFromContext } = useLlmModels();
  // Either the server-provided prop or the client-side context (updated after first message sent)
  const downloadConversationEnabled =
    downloadConversationEnabledProp || downloadConversationEnabledFromContext;

  return (
    <>
      <DialogHeaderCompactMenuContent>
        <DownloadConversationButton
          conversationId={chatId}
          characterName={title}
          disabled={!downloadConversationEnabled}
          showText={true}
        />
      </DialogHeaderCompactMenuContent>
      <DialogHeaderContent>
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
      </DialogHeaderContent>
    </>
  );
}
