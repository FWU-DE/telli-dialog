'use client';

import {
  deleteConversationAction,
  updateConversationTitleAction,
} from '@/app/(authed)/(dialog)/actions';
import { fetchClientSideConversations } from '@/app/(authed)/(dialog)/utils';
import { useToast } from '@/components/common/toast';
import { cn } from '@/utils/tailwind';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAfter, isBefore, isToday, isYesterday, subDays } from 'date-fns';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import SidebarItem from './conversation-item';

export function ChatHistory() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const t = useTranslations('sidebar');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchClientSideConversations,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  function refetchConversations() {
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }

  const todayConversations = conversations.filter((conversation) =>
    isToday(new Date(conversation.createdAt)),
  );

  const yesterdayConversations = conversations.filter((conversation) =>
    isYesterday(new Date(conversation.createdAt)),
  );

  const last7DaysConversations = conversations.filter((conversation) => {
    const date = new Date(conversation.createdAt);
    return isAfter(date, subDays(new Date(), 7)) && !isToday(date) && !isYesterday(date);
  });

  const pastConversations = conversations.filter((conversation) => {
    const date = new Date(conversation.createdAt);
    return isBefore(date, subDays(new Date(), 7));
  });

  function isCurrentConversation(conversationId: string) {
    return pathname.includes(conversationId);
  }

  async function handleDeleteConversation(conversationId: string) {
    const result = await deleteConversationAction({ conversationId });
    if (result.success) {
      toast.success(t('conversation-delete-toast-success'));
      refetchConversations();
      // call router.replace only if the deleted conversation is currently open
      if (isCurrentConversation(conversationId)) {
        router.replace('/');
      }
    } else {
      toast.error(t('conversation-delete-toast-error'));
    }
  }

  async function handleUpdateConversation({ id, name }: { id: string; name: string }) {
    const result = await updateConversationTitleAction({ conversationId: id, name });

    if (result.success) {
      refetchConversations();
    } else {
      toast.error(t('chats-error'));
    }
  }

  return (
    <div className="w-full flex flex-col gap-1 h-full overflow-y-auto overflow-x-hidden">
      {conversations.length > 0 && (
        <>
          {todayConversations.length > 0 && (
            <>
              <p className={cn('font-medium text-left text-sm ms-4 w-full text-main-black')}>
                {tCommon('today')}
              </p>
              {todayConversations.map((conversation) => (
                <SidebarItem
                  key={conversation.id}
                  conversation={conversation}
                  onDeleteConversation={handleDeleteConversation}
                  onUpdateConversation={(name) =>
                    handleUpdateConversation({ id: conversation.id, name })
                  }
                />
              ))}
            </>
          )}

          {yesterdayConversations.length > 0 && (
            <>
              <p className={cn('font-medium text-sm text-left ms-4 mt-4 w-full text-main-black')}>
                {tCommon('yesterday')}
              </p>
              {yesterdayConversations.map((conversation) => (
                <SidebarItem
                  key={conversation.id}
                  conversation={conversation}
                  onDeleteConversation={handleDeleteConversation}
                  onUpdateConversation={(name) =>
                    handleUpdateConversation({ id: conversation.id, name })
                  }
                />
              ))}
            </>
          )}

          {last7DaysConversations.length > 0 && (
            <>
              <p className={cn('font-medium text-sm text-left ms-4 mt-4 w-full text-main-black')}>
                {tCommon('this-week')}
              </p>
              {last7DaysConversations.map((conversation) => (
                <SidebarItem
                  key={conversation.id}
                  conversation={conversation}
                  onDeleteConversation={handleDeleteConversation}
                  onUpdateConversation={(name) =>
                    handleUpdateConversation({ id: conversation.id, name })
                  }
                />
              ))}
            </>
          )}

          {pastConversations.length > 0 && (
            <>
              <p className={cn('font-medium text-sm text-left ms-4 mt-4 w-full text-main-black')}>
                {tCommon('past')}
              </p>
              {pastConversations.map((conversation) => (
                <SidebarItem
                  key={conversation.id}
                  conversation={conversation}
                  onDeleteConversation={handleDeleteConversation}
                  onUpdateConversation={(name) =>
                    handleUpdateConversation({ id: conversation.id, name })
                  }
                />
              ))}
            </>
          )}
        </>
      )}

      {isLoading && (
        <div className="flex flex-col gap-2 w-full items-center justify-center">
          <p className="text-primary animate-pulse">{t('chats-loading')}</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-2 w-full items-center justify-center">
          <p className="text-primary">{t('chats-error')}</p>
          <button onClick={refetchConversations} className="text-primary hover:underline mt-2">
            {t('chats-reload')}
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatHistory;
