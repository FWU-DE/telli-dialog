'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { OverviewFilter } from '@shared/db/schema';
import { LearningScenarioWithImage } from '@shared/learning-scenarios/learning-scenario-service';
import EntityOverview from '@/components/entity-overview/entity-overview';
import EntityCard from '@/components/entity-overview/entity-card';
import { CreateNewLearningScenarioButton } from './create-new-learning-scenario-button';

type LearningScenarioOverviewProps = {
  learningScenarios: LearningScenarioWithImage[];
  activeFilter: OverviewFilter;
  currentUserId: string;
};

export default function LearningScenarioOverview({
  learningScenarios,
  activeFilter,
  currentUserId,
}: LearningScenarioOverviewProps) {
  const router = useRouter();
  const t = useTranslations('learning-scenarios');

  function handleFilterChange(filter: OverviewFilter) {
    const searchParams = new URLSearchParams();
    searchParams.set('filter', filter);
    router.push(`/learning-scenarios?${searchParams.toString()}`);
  }

  return (
    <EntityOverview
      title={t('title')}
      infoTooltip={t('description')}
      searchPlaceholder={t('search-placeholder')}
      createButton={<CreateNewLearningScenarioButton />}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      itemCount={learningScenarios.length}
    >
      {learningScenarios.map((ls) => (
        <EntityCard
          key={ls.id}
          name={ls.name}
          description={ls.description}
          avatarUrl={ls.maybeSignedPictureUrl}
          isOwned={ls.userId === currentUserId}
          onCardClick={() => router.push(`/learning-scenarios/editor/${ls.id}`)}
        />
      ))}
    </EntityOverview>
  );
}
