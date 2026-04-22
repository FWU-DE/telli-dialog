'use client';

import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { OverviewFilter } from '@shared/overview-filter';
import { CharacterWithImage } from './utils';
import EntityOverview from '@/components/entity-overview/entity-overview';
import EntityCard from '@/components/entity-overview/entity-card';
import { CreateNewCharacterButton } from './create-new-character-button';
import { useOverviewFilter } from '@/components/hooks/use-overview-filter';
import { getCharactersByFilterAction } from '../actions/entity-filter-actions';
import { filterAndSortEntities } from '@/components/entity-overview/utils';
import { RichText } from '@/components/common/rich-text';

type CharacterOverviewProps = {
  currentUserId: string;
};

export default function CharacterOverview({ currentUserId }: CharacterOverviewProps) {
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

  const infoContent = (
    <div className="whitespace-pre-line">
      <RichText>{(tags) => t.rich('info-dialog', tags)}</RichText>
    </div>
  );

  return (
    <EntityOverview
      title={t('character')}
      infoTooltip={infoContent}
      searchPlaceholder={t('search-placeholder')}
      createButton={<CreateNewCharacterButton />}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      itemCount={visibleCharacters.length}
    >
      {(searchQuery, sortBy) => {
        const filtered = filterAndSortEntities(visibleCharacters, searchQuery, sortBy);

        return filtered.map((character) => {
          const isOwned = character.userId === currentUserId;
          return (
            <EntityCard
              key={character.id}
              name={character.name}
              description={character.description}
              avatarUrl={character.maybeSignedPictureUrl}
              isOwned={isOwned}
              href={isOwned ? `/characters/editor/${character.id}` : `/characters/${character.id}`}
              chatHref={`/characters/d/${character.id}`}
            />
          );
        });
      }}
    </EntityOverview>
  );
}
