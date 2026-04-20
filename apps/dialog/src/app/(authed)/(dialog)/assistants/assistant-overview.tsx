'use client';

import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { OverviewFilter } from '@shared/overview-filter';
import { AssistantWithImage } from '../custom/utils';
import EntityOverview from '@/components/entity-overview/entity-overview';
import EntityCard from '@/components/entity-overview/entity-card';
import CreateNewAssistantButton from '../custom/create-new-assistant-button';
import { useOverviewFilter } from '@/components/hooks/use-overview-filter';
import { getAssistantsByFilterAction } from '../actions/entity-filter-actions';
import { filterAndSortEntities } from '@/components/entity-overview/utils';
import RichText from '@/components/common/rich-text';

type AssistantOverviewProps = {
  currentUserId: string;
};

export default function AssistantOverview({ currentUserId }: AssistantOverviewProps) {
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
      createButton={<CreateNewAssistantButton />}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      itemCount={visibleAssistants.length}
    >
      {(searchQuery, sortBy) => {
        const filtered = filterAndSortEntities(visibleAssistants, searchQuery, sortBy);

        return filtered.map((assistant) => (
          <EntityCard
            key={assistant.id}
            name={assistant.name}
            description={assistant.description}
            avatarUrl={assistant.maybeSignedPictureUrl}
            isOwned={assistant.userId === currentUserId}
            href={
              assistant.userId === currentUserId
                ? `/assistants/editor/${assistant.id}`
                : `/assistants/${assistant.id}`
            }
            chatHref={`/assistants/d/${assistant.id}`}
          />
        ));
      }}
    </EntityOverview>
  );
}
