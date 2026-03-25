'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { OverviewFilter } from '@shared/overview-filter';
import { CharacterWithImage } from './utils';
import EntityOverview from '@/components/entity-overview/entity-overview';
import EntityCard from '@/components/entity-overview/entity-card';
import { CreateNewCharacterButton } from './create-new-character-button';

type CharacterOverviewProps = {
  characters: CharacterWithImage[];
  activeFilter: OverviewFilter;
  currentUserId: string;
};

export default function CharacterOverview({
  characters,
  activeFilter,
  currentUserId,
}: CharacterOverviewProps) {
  const router = useRouter();
  const t = useTranslations('characters');

  function handleFilterChange(filter: OverviewFilter) {
    const searchParams = new URLSearchParams();
    searchParams.set('filter', filter);
    router.push(`/characters?${searchParams.toString()}`);
  }

  return (
    <EntityOverview
      title={t('character')}
      infoTooltip={t('description')}
      searchPlaceholder={t('search-placeholder')}
      createButton={<CreateNewCharacterButton />}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      itemCount={characters.length}
    >
      {characters.map((character) => (
        <EntityCard
          key={character.id}
          name={character.name}
          description={character.description}
          avatarUrl={character.maybeSignedPictureUrl}
          isOwned={character.userId === currentUserId}
          onCardClick={() => router.push(`/characters/editor/${character.id}`)}
          onChatClick={() => router.push(`/characters/d/${character.id}`)}
        />
      ))}
    </EntityOverview>
  );
}
