'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { OverviewFilter } from '@shared/overview-filter';
import { AssistantWithImage } from './utils';
import EntityOverview from '@/components/entity-overview/entity-overview';
import EntityCard from '@/components/entity-overview/entity-card';
import CreateNewCustomGptButton from './create-new-customgpt-button';

type CustomGptOverviewProps = {
  assistants: AssistantWithImage[];
  activeFilter: OverviewFilter;
  currentUserId: string;
};

export default function CustomGptOverview({
  assistants,
  activeFilter,
  currentUserId,
}: CustomGptOverviewProps) {
  const router = useRouter();
  const t = useTranslations('custom-gpt');

  function handleFilterChange(filter: OverviewFilter) {
    const searchParams = new URLSearchParams();
    searchParams.set('filter', filter);
    router.push(`/custom?${searchParams.toString()}`);
  }

  return (
    <EntityOverview
      title={t('title')}
      infoTooltip={t('description')}
      searchPlaceholder={t('search-placeholder')}
      createButton={<CreateNewCustomGptButton />}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      itemCount={assistants.length}
    >
      {assistants.map((gpt) => (
        <EntityCard
          key={gpt.id}
          name={gpt.name}
          description={gpt.description}
          avatarUrl={gpt.maybeSignedPictureUrl}
          isOwned={gpt.userId === currentUserId}
          onCardClick={() => router.push(`/custom/editor/${gpt.id}?create=false`)}
          onChatClick={() => router.push(`/custom/d/${gpt.id}`)}
        />
      ))}
    </EntityOverview>
  );
}
