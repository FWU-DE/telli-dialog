'use client';

import {
  deleteConversationAction,
  updateConversationTitleAction,
} from '@/app/(authed)/(dialog)/actions';
import { fetchClientSideConversations } from '@/app/(authed)/(dialog)/utils';
import { useToast } from '@/components/common/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { SidebarGroup, SidebarMenu } from '@ui/components/Sidebar';
import { ChatHistoryItem } from './chat-history-item';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@ui/components/InputGroup';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';

export function ChatHistory() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const t = useTranslations('sidebar');
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');

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

  async function handleUpdateConversation({ id, name }: { id: string; name: string }) {
    const result = await updateConversationTitleAction({ conversationId: id, name });

    if (result.success) {
      refetchConversations();
    } else {
      toast.error(t('chats-error'));
    }
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

  function isCurrentConversation(conversationId: string) {
    return pathname.includes(conversationId);
  }

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return conversations.filter((conversation) =>
      (conversation.name ?? '').toLowerCase().includes(normalizedSearch),
    );
  }, [conversations, searchText]);

  return (
    <>
      <SidebarGroup className="p-0">
        <InputGroup className="mb-2 bg-sidebar-input text-sidebar-input-foreground rounded-full">
          <InputGroupInput
            value={searchText}
            placeholder="Chat suchen"
            onChange={(event) => setSearchText(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <MagnifyingGlassIcon />
          </InputGroupAddon>
        </InputGroup>
        <SidebarMenu>
          {filteredConversations.map((conversation) => (
            <ChatHistoryItem
              key={conversation.id}
              conversation={conversation}
              onDeleteConversation={handleDeleteConversation}
              onUpdateConversation={(name) =>
                handleUpdateConversation({ id: conversation.id, name })
              }
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {isLoading && (
        <div className="flex flex-col w-full items-center ">
          <p className="text-primary animate-pulse">{t('chats-loading')}</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-2 w-full items-center justify-center">
          <p className="text-primary">{t('chats-error')}</p>
          <Button onClick={refetchConversations}>{t('chats-reload')}</Button>
        </div>
      )}
    </>
  );
}
