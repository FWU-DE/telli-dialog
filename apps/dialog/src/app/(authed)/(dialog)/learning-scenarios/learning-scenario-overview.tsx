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

  const infoContent = (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold">{t('info-dialog.q1')}</p>
        <p>{t('info-dialog.a1')}</p>
      </div>
      <p>{t('info-dialog.a1-2')}</p>
      <div>
        <p className="font-semibold">{t('info-dialog.q2')}</p>
        <p>{t('info-dialog.a2')}</p>
      </div>
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
        const q = searchQuery.trim().toLowerCase();

        const filtered = q
          ? visibleLearningScenarios
              .filter((scenario) => scenario.name.toLowerCase().includes(q))
              .slice()
          : visibleLearningScenarios.slice();
        filtered.sort((a, b) =>
          sortBy === 'name'
            ? a.name.localeCompare(b.name)
            : b.updatedAt.getTime() - a.updatedAt.getTime(),
        );

        return filtered.map((scenario) => (
          <EntityCard
            key={scenario.id}
            name={scenario.name}
            description={scenario.description}
            avatarUrl={scenario.maybeSignedPictureUrl}
            isOwned={scenario.userId === currentUserId}
            onCardClick={() => router.push(`/learning-scenarios/editor/${scenario.id}`)}
          />
        ));
      }}
    </EntityOverview>
  );
}
