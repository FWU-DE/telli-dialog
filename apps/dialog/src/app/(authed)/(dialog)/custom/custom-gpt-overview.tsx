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

  return (
    <EntityOverview
      title={t('title')}
      infoTooltip={t('description')}
      searchPlaceholder={t('search-placeholder')}
      createButton={<CreateNewCustomGptButton />}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      itemCount={visibleAssistants.length}
    >
      {(searchQuery) =>
        visibleAssistants
          .filter((gpt) => gpt.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((gpt) => (
            <EntityCard
              key={gpt.id}
              name={gpt.name}
              description={gpt.description}
              avatarUrl={gpt.maybeSignedPictureUrl}
              isOwned={gpt.userId === currentUserId}
              onCardClick={() => router.push(`/custom/editor/${gpt.id}?create=false`)}
              onChatClick={() => router.push(`/custom/d/${gpt.id}`)}
            />
          ))
      }
    </EntityOverview>
  );
}
