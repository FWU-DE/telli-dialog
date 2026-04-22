'use client';

import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { OverviewFilter } from '@shared/overview-filter';
import { LearningScenarioWithImage } from '@shared/learning-scenarios/learning-scenario-service';
import EntityOverview from '@/components/entity-overview/entity-overview';
import EntityCard from '@/components/entity-overview/entity-card';
import { CreateNewLearningScenarioButton } from './create-new-learning-scenario-button';
import { useOverviewFilter } from '@/components/hooks/use-overview-filter';
import { getLearningScenariosByFilterAction } from '../actions/entity-filter-actions';
import { filterAndSortEntities } from '@/components/entity-overview/utils';
import { RichText } from '@/components/common/rich-text';

type LearningScenarioOverviewProps = {
  currentUserId: string;
};

export default function LearningScenarioOverview({ currentUserId }: LearningScenarioOverviewProps) {
  const t = useTranslations('learning-scenarios');
  const [visibleLearningScenarios, setVisibleLearningScenarios] = useState<
    LearningScenarioWithImage[]
  >([]);

  const fetchLearningScenarios = useCallback(async (filter: OverviewFilter) => {
    const entities = await getLearningScenariosByFilterAction(filter);
    setVisibleLearningScenarios(entities);
  }, []);

  const [activeFilter, setActiveFilter] = useOverviewFilter(
    'learning-scenarios',
    fetchLearningScenarios,
  );

  async function handleFilterChange(filter: OverviewFilter) {
    await setActiveFilter(filter);
  }

  const infoContent = (
    <div className="whitespace-pre-line">
      <RichText>{(tags) => t.rich('info-dialog', tags)}</RichText>
    </div>
  );

  return (
    <EntityOverview
      title={t('title')}
      infoTooltip={infoContent}
      searchPlaceholder={t('search-placeholder')}
      createButton={<CreateNewLearningScenarioButton />}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      itemCount={visibleLearningScenarios.length}
    >
      {(searchQuery, sortBy) => {
        const filtered = filterAndSortEntities(visibleLearningScenarios, searchQuery, sortBy);

        return filtered.map((scenario) => {
          const isOwned = scenario.userId === currentUserId;
          return (
            <EntityCard
              key={scenario.id}
              name={scenario.name}
              description={scenario.description}
              avatarUrl={scenario.maybeSignedPictureUrl}
              isOwned={isOwned}
              href={
                isOwned
                  ? `/learning-scenarios/editor/${scenario.id}`
                  : `/learning-scenarios/${scenario.id}`
              }
            />
          );
        });
      }}
    </EntityOverview>
  );
}
