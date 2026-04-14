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
import { filterAndSortEntities } from '@/components/entity-overview/utils';

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

  const infoContent = (
    <div className="flex flex-col gap-8 whitespace-pre-line">
      <div>
        <p className="font-semibold">{t('info-dialog.q1')}</p>
        <p>{t('info-dialog.a1')}</p>
      </div>
      <div>
        <p className="font-semibold">{t('info-dialog.q2')}</p>
        <p>{t('info-dialog.a2')}</p>
      </div>
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
              onCardClick={() =>
                router.push(
                  isOwned ? `/characters/editor/${character.id}` : `/characters/${character.id}`,
                )
              }
              onChatClick={() => router.push(`/characters/d/${character.id}`)}
            />
          );
        });
      }}
    </EntityOverview>
  );
}
