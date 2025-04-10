'use client';

import Link from 'next/link';
import React from 'react';
import { cn } from '@/utils/tailwind';
import HeaderPortal from '../header-portal';
import ProfileMenu from '@/components/navigation/profile-menu';
import {
  NewChatButton,
  ToggleSidebarButton,
} from '@/components/navigation/sidebar/collapsible-sidebar';
import SearchBarInput from '@/components/search-bar';
import { type UserAndContext } from '@/auth/types';
import { CharacterAccessLevel, CustomGptModel } from '@/db/schema';
import { useTranslations } from 'next-intl';
import CustomGptContainer from './custom-gpt-container';
import { buildCharactersUrl as buildRedirectUrl } from '../characters/utils';
import CreateNewCustomGptButton from './create-new-customgpt-button';

export default function Page2({
  user,
  customGpts,
  accessLevel,
}: {
  user: UserAndContext;
  customGpts: CustomGptModel[];
  accessLevel: CharacterAccessLevel;
}) {
  const [input, setInput] = React.useState('');

  const filterDisabled = customGpts.length < 1;

  const filteredCharacters = filterCharacters(customGpts, input);

  const t = useTranslations('custom-gpt');

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <NewChatButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl mb-6">{t('character')}</h1>
        <span>{t('description')}</span>
      </div>
      <div className="flex flex-wrap-reverse justify-between gap-2 text-base mb-4 max-w-3xl mx-auto w-full mt-16">
        <SearchBarInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={cn(
            'p-2 px-4 focus:outline-none disabled:bg-light-gray disabled:border-gray-100 disabled:cursor-not-allowed',
          )}
          placeholder={t('search-placeholder')}
          disabled={filterDisabled}
        />
        <CreateNewCustomGptButton />
      </div>

      <div className="flex gap-2 mt-4 text-base mb-4 max-w-3xl mx-auto w-full">
        <Link
          href={buildRedirectUrl('global', "custom")}
          className={cn(
            'hover:underline px-2 p-1 text-primary',
            accessLevel === 'global' && 'underline',
          )}
        >
          {t('visibility-global')}
        </Link>
        <Link
          href={buildRedirectUrl('school',"custom")}
          className={cn(
            'hover:underline px-2 p-1 text-primary',
            accessLevel === 'school' && 'underline',
          )}
        >
          {t('visibility-school')}
        </Link>
        <Link
          href={buildRedirectUrl('private',"custom")}
          className={cn(
            'hover:underline px-2 p-1  text-primary',
            accessLevel === 'private' && 'underline',
          )}
        >
          {t('visibility-private')}
        </Link>
      </div>
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-2 w-full">
          {filteredCharacters.map((customGpt) => (
            <CustomGptContainer {...customGpt} currentUserId={user.id} key={customGpt.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

function filterCharacters(customGpt: CustomGptModel[], input: string): CustomGptModel[] {
  const lowerCaseInput = input.toLowerCase();

  return customGpt.filter((character) => {
    const mainMatch = character.name.toLowerCase().includes(lowerCaseInput);

    return mainMatch;
  });
}
