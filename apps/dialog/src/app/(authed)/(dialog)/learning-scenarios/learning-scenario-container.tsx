'use client';

import HeaderPortal from '../header-portal';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import React from 'react';
import { cn } from '@/utils/tailwind';
import SearchBarInput from '@/components/search-bar';
import { type UserAndContext } from '@/auth/types';
import { useTranslations } from 'next-intl';
import { LearningScenarioWithImage } from '@shared/learning-scenarios/learning-scenario-service';
import { AccessLevel } from '@shared/db/schema';
import Link from 'next/link';
import { buildGenericUrl } from '@/app/(authed)/(dialog)/utils.client';
import { useFederalState } from '@/components/providers/federal-state-provider';
import { CreateNewLearningScenarioButton } from './create-new-learning-scenario-button';
import LearningScenarioItem from './learning-scenario-item';

type LearningScenarioContainerProps = {
  accessLevel: AccessLevel;
  learningScenarios: LearningScenarioWithImage[];
  user: UserAndContext;
};

export function LearningScenarioContainer({
  accessLevel,
  learningScenarios,
  user,
}: LearningScenarioContainerProps) {
  const [input, setInput] = React.useState('');
  const federalState = useFederalState();

  const filterDisabled = learningScenarios.length < 1;

  const filteredLearningScenarios = filterLearningScenarios(learningScenarios, input);
  const t = useTranslations('learning-scenarios');

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu userAndContext={user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl mb-6">{t('title')}</h1>
        <p>{t('description')}</p>
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
        <CreateNewLearningScenarioButton />
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
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-2 w-full">
          {filteredLearningScenarios.map((learningScenario) => (
            <LearningScenarioItem
              {...learningScenario}
              key={learningScenario.id}
              currentUserId={user.id}
            />
          ))}
        </div>
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
