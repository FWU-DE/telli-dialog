'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { OverviewFilter } from '@shared/overview-filter';
import { CharacterWithImage } from './utils';
import EntityOverview from '@/components/entity-overview/entity-overview';
import EntityCard from '@/components/entity-overview/entity-card';
import { CreateNewCharacterButton } from './create-new-character-button';
import { useOverviewFilter } from '@/components/hooks/use-overview-filter';
import { getCharactersByFilterAction } from '../actions/entity-filter-actions';

type CharacterOverviewProps = {
  currentUserId: string;
};

export default function CharacterOverview({ currentUserId }: CharacterOverviewProps) {
  const router = useRouter();
  const t = useTranslations('characters');
  const [visibleCharacters, setVisibleCharacters] = useState<CharacterWithImage[]>([]);

  const fetchCharacters = useCallback(async (filter: OverviewFilter) => {
    const entities = await getCharactersByFilterAction(filter);
    setVisibleCharacters(entities);
  }, []);

  const [activeFilter, setActiveFilter] = useOverviewFilter('characters', fetchCharacters);

  async function handleFilterChange(filter: OverviewFilter) {
    await setActiveFilter(filter);
  }

  return (
    <EntityOverview
      title={t('character')}
      infoTooltip={t('description')}
      searchPlaceholder={t('search-placeholder')}
      createButton={<CreateNewCharacterButton />}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      itemCount={visibleCharacters.length}
    >
      {(searchQuery) =>
        visibleCharacters
          .filter((character) => character.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((character) => (
            <EntityCard
              key={character.id}
              name={character.name}
              description={character.description}
              avatarUrl={character.maybeSignedPictureUrl}
              isOwned={character.userId === currentUserId}
              onCardClick={() => router.push(`/characters/editor/${character.id}`)}
              onChatClick={() => router.push(`/characters/d/${character.id}`)}
            />
          ))
      }
    </EntityOverview>
  );
}
