'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { OverviewFilter } from '@shared/overview-filter';
import { LearningScenarioWithImage } from '@shared/learning-scenarios/learning-scenario-service';
import EntityOverview from '@/components/entity-overview/entity-overview';
import EntityCard from '@/components/entity-overview/entity-card';
import { CreateNewLearningScenarioButton } from './create-new-learning-scenario-button';
import { useOverviewFilter } from '@/components/hooks/use-overview-filter';
import { getLearningScenariosByFilterAction } from '../actions/entity-filter-actions';

type LearningScenarioOverviewProps = {
  currentUserId: string;
};

export default function LearningScenarioOverview({ currentUserId }: LearningScenarioOverviewProps) {
  const router = useRouter();
  const t = useTranslations('learning-scenarios');
  const [visibleLearningScenarios, setVisibleLearningScenarios] = useState<
    LearningScenarioWithImage[]
  >([]);

  const fetchLearningScenarios = useCallback(async (filter: OverviewFilter) => {
    const entities = await getLearningScenariosByFilterAction(filter);
    setVisibleLearningScenarios(entities);
  }, []);

  const [activeFilter, setActiveFilter] = useOverviewFilter('scenarios', fetchLearningScenarios);

  async function handleFilterChange(filter: OverviewFilter) {
    await setActiveFilter(filter);
  }

  return (
    <EntityOverview
      title={t('title')}
      infoTooltip={t('description')}
      searchPlaceholder={t('search-placeholder')}
      createButton={<CreateNewLearningScenarioButton />}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      itemCount={visibleLearningScenarios.length}
    >
      {(searchQuery) =>
        visibleLearningScenarios
          .filter((ls) => ls.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((ls) => (
            <EntityCard
              key={ls.id}
              name={ls.name}
              description={ls.description}
              avatarUrl={ls.maybeSignedPictureUrl}
              isOwned={ls.userId === currentUserId}
              onCardClick={() => router.push(`/learning-scenarios/editor/${ls.id}`)}
            />
          ))
      }
    </EntityOverview>
  );
}
