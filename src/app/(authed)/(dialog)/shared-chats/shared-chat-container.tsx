'use client';

import HeaderPortal from '../header-portal';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import { SharedSchoolConversationModel } from '@/db/schema';
import React from 'react';
import { cn } from '@/utils/tailwind';
import Link from 'next/link';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import PlusIcon from '@/components/icons/plus';
import SharedChatItem from './shared-chat-item';
import SearchBarInput from '@/components/search-bar';
import { type UserAndContext } from '@/auth/types';
import { useTranslations } from 'next-intl';
import { SharedChatWithImage } from './[sharedSchoolChatId]/utils';
type SharedChatContainerProps = {
  sharedChats: SharedChatWithImage[];
  user: UserAndContext;
};

export function SharedChatContainer({ sharedChats, user }: SharedChatContainerProps) {
  const [input, setInput] = React.useState('');

  const filterDisabled = sharedChats.length < 1;

  const filteredSharedChats = filterSharedChats(sharedChats, input);
  const t = useTranslations('shared-chats');

  return (
    <div className={'flex flex-col gap-2 w-full'}>
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto w-full">
        <h1 className="text-3xl mb-6">{t('title')}</h1>
        <p>{t('description')}</p>
        <div className="flex flex-wrap gap-4 items-center mt-16">
          <SearchBarInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={cn(
              'p-2 px-4 focus:outline-none disabled:bg-light-gray disabled:border-gray-100 disabled:cursor-not-allowed',
            )}
            placeholder={t('search-placeholder')}
            disabled={filterDisabled}
          />
          <div className="flex-grow" />
          <Link
            title={t('form.button-create')}
            href="/shared-chats/create"
            className={cn(buttonPrimaryClassName, 'flex gap-2 items-center group py-2')}
          >
            <PlusIcon className="fill-primary-text group-hover:fill-secondary-text" />
            <span>{t('form.button-create')}</span>
          </Link>
        </div>
        {sharedChats.length < 1 && <p className="text-dark-gray mt-16">{t('no-dialogs')}</p>}
        {filteredSharedChats.length > 0 && (
          <div className="max-w-3xl mx-auto w-full flex gap-2 flex-col mt-6">
            {filteredSharedChats.map((sharedChat) => (
              <SharedChatItem {...sharedChat} key={sharedChat.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function filterSharedChats(sharedChats: SharedChatWithImage[], input: string) {
  const lowerCaseInput = input.toLowerCase();

  return sharedChats.filter((sharedChat) => {
    const mainMatch =
      sharedChat.name.toLowerCase().includes(lowerCaseInput) ||
      sharedChat.description.toLowerCase().includes(lowerCaseInput);

    return mainMatch;
  });
}
