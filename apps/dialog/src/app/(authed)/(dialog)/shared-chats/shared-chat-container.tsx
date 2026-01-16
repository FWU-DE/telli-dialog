'use client';

import HeaderPortal from '../header-portal';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import React from 'react';
import { cn } from '@/utils/tailwind';
import SharedChatItem from './shared-chat-item';
import SearchBarInput from '@/components/search-bar';
import { type UserAndContext } from '@/auth/types';
import { useTranslations } from 'next-intl';
import { CreateNewSharedChatButton } from './create-new-shared-chat';
import { LearningScenarioWithImage } from '@shared/learning-scenarios/learning-scenario-service';

type SharedChatContainerProps = {
  learningScenarios: LearningScenarioWithImage[];
  user: UserAndContext;
};

export function SharedChatContainer({ learningScenarios, user }: SharedChatContainerProps) {
  const [input, setInput] = React.useState('');

  const filterDisabled = learningScenarios.length < 1;

  const filteredLearningScenarios = filterLearningScenarios(learningScenarios, input);
  const t = useTranslations('shared-chats');

  return (
    <div className={'flex flex-col gap-2 w-full'}>
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu userAndContext={user} />
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
          <CreateNewSharedChatButton />
        </div>
        {learningScenarios.length < 1 && <p className="text-dark-gray mt-16">{t('no-dialogs')}</p>}
        {filteredLearningScenarios.length > 0 && (
          <div className="max-w-3xl mx-auto w-full flex gap-2 flex-col mt-6">
            {filteredLearningScenarios.map((learningScenario) => (
              <SharedChatItem {...learningScenario} key={learningScenario.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function filterLearningScenarios(learningScenarios: LearningScenarioWithImage[], input: string) {
  const lowerCaseInput = input.toLowerCase();

  return learningScenarios.filter((learningScenario) => {
    const mainMatch =
      learningScenario.name.toLowerCase().includes(lowerCaseInput) ||
      learningScenario.description.toLowerCase().includes(lowerCaseInput);

    return mainMatch;
  });
}
