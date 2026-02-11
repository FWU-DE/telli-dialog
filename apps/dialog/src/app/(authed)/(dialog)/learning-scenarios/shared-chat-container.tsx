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
import { AccessLevel } from '@shared/db/schema';
import Link from 'next/link';
import { buildGenericUrl } from '@/app/(authed)/(dialog)/utils.client';
import { useFederalState } from '@/components/providers/federal-state-provider';

type SharedChatContainerProps = {
  accessLevel: AccessLevel;
  learningScenarios: LearningScenarioWithImage[];
  user: UserAndContext;
};

export function SharedChatContainer({
  accessLevel,
  learningScenarios,
  user,
}: SharedChatContainerProps) {
  const [input, setInput] = React.useState('');
  const federalState = useFederalState();

  const filterDisabled = learningScenarios.length < 1;

  const filteredLearningScenarios = filterLearningScenarios(learningScenarios, input);
  const t = useTranslations('learning-scenarios');

  return (
    <div className="flex flex-col gap-2 w-full">
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

        <div className="flex gap-2 mt-4 text-base mb-4 max-w-3xl mx-auto w-full">
          <Link
            href={buildGenericUrl('global', 'learning-scenarios')}
            className={cn(
              'hover:underline px-2 p-1 text-primary',
              accessLevel === 'global' && 'underline',
            )}
          >
            {t('visibility-global')}
          </Link>
          {federalState?.featureToggles?.isShareTemplateWithSchoolEnabled && (
            <Link
              href={buildGenericUrl('school', 'learning-scenarios')}
              className={cn(
                'hover:underline px-2 p-1 text-primary',
                accessLevel === 'school' && 'underline',
              )}
            >
              {t('visibility-school')}
            </Link>
          )}
          <Link
            href={buildGenericUrl('private', 'learning-scenarios')}
            className={cn(
              'hover:underline px-2 p-1  text-primary',
              accessLevel === 'private' && 'underline',
            )}
          >
            {t('visibility-private')}
          </Link>
        </div>

        {filteredLearningScenarios.length > 0 && (
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex gap-2 flex-col mt-6">
              {filteredLearningScenarios.map((learningScenario) => (
                <SharedChatItem {...learningScenario} key={learningScenario.id} />
              ))}
            </div>
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
