'use client';

import { type UserAndContext } from '@/auth/types';
import { useToast } from '@/components/common/toast';
import useBreakpoints from '@/components/hooks/use-breakpoints';
import CharacterAvatarIcon from '@/components/icons/character-avatar';
import FourBoxes from '@/components/icons/four-boxes';
import RobotIcon from '@/components/icons/robot';
import SharedChatIcon from '@/components/icons/shared-chat';
import TelliIcon from '@/components/icons/telli';
import IntelliPointsIcon from '@/components/icons/telli-points';
import CollapsibleSidebar from '@/components/navigation/sidebar/collapsible-sidebar';
import SidebarItem from '@/components/navigation/sidebar/conversation-item';
import { useSidebarVisibility } from '@/components/navigation/sidebar/sidebar-provider';
import TelliPointsProgressBar from '@/components/telli-points-progress-bar';

import { cn } from '@/utils/tailwind';
import { smallButtonPrimaryClassName } from '@/utils/tailwind/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAfter, isBefore, isToday, isYesterday, subDays } from 'date-fns';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import deleteConversationAction, { updateConversationNameAction } from './actions';
import { fetchClientSideConversations, getPriceLimitByUser } from './utils';
import { HELP_MODE_GPT_ID } from '@/db/const';
import { FederalStateId } from '@/utils/vidis/const';
import { getDisabledFederalFeatures } from '@/utils/feature-flags/get-features';

type Props = {
  user: UserAndContext;
  currentModelCosts: number;
};

export default function DialogSidebar({ user, currentModelCosts }: Props) {
  const { isBelow } = useBreakpoints();
  const { toggle, isOpen } = useSidebarVisibility();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const tCommon = useTranslations('common');
  const t = useTranslations('sidebar');
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
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }

  React.useEffect(() => {
    if (isOpen && isBelow.md) {
      toggle();
    }
  }, [pathname]);

  // TODO: this is a dirty hack to remove the sidebar for shared chats
  if (
    pathname.match(/^\/shared-chats\/[^/]+\/share$/) ||
    pathname.match(/^\/characters\/editor\/[^/]+\/share$/)
  ) {
    return null;
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

  function handleDeleteConversation(conversationId: string) {
    deleteConversationAction({ conversationId })
      .then(() => {
        toast.success(t('conversation-delete-toast-success'));
        refetchConversations();
        router.replace('/');
      })
      .catch((error) => {
        console.error({ error });
        toast.error(t('conversation-delete-toast-error'));
      });
  }

  function handleUpdateConversation({ id, name }: { id: string; name: string }) {
    updateConversationNameAction({ conversationId: id, name })
      .then(() => {
        refetchConversations();
        router.refresh();
      })
      .catch((error) => {
        console.error({ error });
      });
  }
  const { disable_shared_chats, disable_characters, disable_customGpt } =
    getDisabledFederalFeatures({
      id: user.federalState.id as FederalStateId,
    });

  return (
    <CollapsibleSidebar>
      <nav className="flex text-sm flex-col items-start overflow-y-hidden px-1">
        <div className="flex flex-col items-start px-5 w-full">
          <hr className="w-full my-2" />

          <Link href="/" className="w-full flex gap-2 items-center hover:underline px-2 py-1.5">
            <TelliIcon className="w-4 h-4 fill-primary" />
            <span className="text-base font-medium text-primary">telli</span>
          </Link>
          <hr className="w-full my-2" />
          <div className="w-full items-center flex flex-col gap-1 h-fit">
            {
              <>
                {user.school.userRole === 'teacher' && !disable_shared_chats && (
                  <Link prefetch href="/shared-chats" className="w-full">
                    <div
                      className={cn(
                        'flex items-center gap-2 stroke-main-900 text-primary hover:underline py-1.5 w-full',
                        pathname.startsWith('/shared-chats') && 'underline',
                      )}
                    >
                      <SharedChatIcon className="w-6 h-6" />
                      <span className="text-base">{t('class-chats')}</span>
                    </div>
                  </Link>
                )}
                {user.school.userRole === 'teacher' && !disable_characters && (
                  <Link prefetch href="/characters" className="w-full">
                    <div
                      className={cn(
                        'flex items-center gap-2 stroke-main-900 text-primary hover:underline py-1.5 w-full',
                        (pathname === '/characters' || pathname.includes('/characters/editor')) &&
                          'underline',
                      )}
                    >
                      <CharacterAvatarIcon className="w-6 h-5" />
                      <span className="text-base">{t('characters')}</span>
                    </div>
                  </Link>
                )}

                <Link href="/custom" className="w-full">
                  <div
                    className={cn(
                      'flex items-center gap-2 stroke-main-900 text-primary hover:underline py-1.5 w-full',
                      (pathname === '/custom' || pathname.includes('custom/editor')) &&
                        !pathname.includes(HELP_MODE_GPT_ID) &&
                        'underline',
                    )}
                  >
                    <FourBoxes className="w-6 h-6" />
                    <span className="text-base">{t('custom-gpt')}</span>
                  </div>
                </Link>
                {user.school.userRole === 'teacher' && !disable_customGpt && (
                  <Link href={`/custom/d/${HELP_MODE_GPT_ID}`} className="w-full">
                    <div
                      className={cn(
                        'flex items-center gap-2 stroke-main-900 text-primary hover:underline py-1.5 w-full',
                        pathname.includes(HELP_MODE_GPT_ID) && 'underline',
                      )}
                    >
                      <RobotIcon className="w-6 h-6" />
                      <span className="text-base">{t('help-mode')}</span>
                    </div>
                  </Link>
                )}
                <hr className="w-full px-1 my-2" />
              </>
            }
            <div className="flex flex-col gap-2 w-full px-1 py-2 ml-1">
              <div className="flex gap-2 items-center w-full pb-2 text-primary">
                <IntelliPointsIcon className="w-4 h-4" />
                <span className="text-base">{t('telli-points')}</span>
              </div>
              <TelliPointsProgressBar
                percentage={100 - (currentModelCosts / (getPriceLimitByUser(user) ?? 500)) * 100}
              />
              <hr className="my-2" />
            </div>
          </div>
        </div>
        <div className="w-full items-center flex flex-col gap-1 h-full pt-4 overflow-y-auto overflow-x-hidden px-4">
          {conversations && (
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
                  <p
                    className={cn('font-medium text-sm text-left ms-4 mt-4 w-full text-main-black')}
                  >
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
                  <p
                    className={cn('font-medium text-sm text-left ms-4 mt-4 w-full text-main-black')}
                  >
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
                  <p
                    className={cn('font-medium text-sm text-left ms-4 mt-4 w-full text-main-black')}
                  >
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
              <button
                onClick={refetchConversations}
                className={cn(smallButtonPrimaryClassName, 'mt-2')}
              >
                {t('chats-reload')}
              </button>
            </div>
          )}
        </div>
      </nav>
    </CollapsibleSidebar>
  );
}
