'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { OverviewFilter } from '@shared/overview-filter';
import { AssistantWithImage } from './utils';
import EntityOverview from '@/components/entity-overview/entity-overview';
import EntityCard from '@/components/entity-overview/entity-card';
import CreateNewCustomGptButton from './create-new-customgpt-button';
import { useOverviewFilter } from '@/components/hooks/use-overview-filter';
import { getAssistantsByFilterAction } from '../actions/entity-filter-actions';

type CustomGptOverviewProps = {
  currentUserId: string;
};

export default function CustomGptOverview({ currentUserId }: CustomGptOverviewProps) {
  const router = useRouter();
  const t = useTranslations('custom-gpt');
  const [visibleAssistants, setVisibleAssistants] = useState<AssistantWithImage[]>([]);

  const fetchAssistants = useCallback(async (filter: OverviewFilter) => {
    const entities = await getAssistantsByFilterAction(filter);
    setVisibleAssistants(entities);
  }, []);

  const [activeFilter, setActiveFilter] = useOverviewFilter('gpts', fetchAssistants);

  async function handleFilterChange(filter: OverviewFilter) {
    await setActiveFilter(filter);
  }

  const handleCardClick = (gptId: string) => {
    const assistant = visibleAssistants.find((gpt) => gpt.id === gptId);
    if (assistant) {
      if (assistant.userId === currentUserId) {
        router.push(`/assistants/editor/${gptId}`);
      } else {
        router.push(`/assistants/${gptId}`);
      }
    }
  };

  const infoContent = (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold">{t('info-dialog.q1')}</p>
        <p>{t('info-dialog.a1')}</p>
      </div>
      <div>
        <p className="font-semibold">{t('info-dialog.q2')}</p>
        <p>{t('info-dialog.a2')}</p>
      </div>
      <div>
        <p className="font-semibold">{t('info-dialog.q3')}</p>
        <p>{t('info-dialog.a3')}</p>
      </div>
    </div>
  );

  return (
    <EntityOverview
      title={t('title')}
      infoTooltip={infoContent}
      searchPlaceholder={t('search-placeholder')}
      createButton={<CreateNewCustomGptButton isNewUiDesignEnabled={true} />}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      itemCount={visibleAssistants.length}
    >
      {(searchQuery, sortBy) => {
        const q = searchQuery.trim().toLowerCase();
        const filtered = q
          ? visibleAssistants
              .filter((assistant) => assistant.name.toLowerCase().includes(q))
              .slice()
          : visibleAssistants.slice();
        filtered.sort((a, b) =>
          sortBy === 'name'
            ? a.name.localeCompare(b.name)
            : b.updatedAt.getTime() - a.updatedAt.getTime(),
        );

        return filtered.map((assistant) => (
          <EntityCard
            key={assistant.id}
            name={assistant.name}
            description={assistant.description}
            avatarUrl={assistant.maybeSignedPictureUrl}
            isOwned={assistant.userId === currentUserId}
            onCardClick={() => handleCardClick(assistant.id)}
            onChatClick={() => router.push(`/assistants/d/${assistant.id}`)}
          />
        ));
      }}
    </EntityOverview>
  );
}
