import { accessLevelSchema, overviewFilterSchema } from '@shared/db/schema';
import CharacterPreviewPage from './character-preview-page';
import { enrichCharactersWithImage } from './utils';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import {
  getCharacterByAccessLevel,
  getCharactersByOverviewFilter,
} from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { getFederalStateById } from '@shared/federal-states/federal-state-service';
import CharacterOverview from './character-overview';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  visibility: accessLevelSchema.optional().default('private'),
  filter: overviewFilterSchema.optional().default('all'),
});

export default async function Page(props: PageProps<'/characters'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const { user, school, federalState } = await requireAuth();
  const fullFederalState = await getFederalStateById(federalState.id);
  const isNewUi = fullFederalState.featureToggles.isNewUiDesignEnabled;

  if (isNewUi) {
    const filter = searchParams.filter;
    const _characters = await getCharactersByOverviewFilter({
      filter,
      schoolId: school.id,
      userId: user.id,
      federalStateId: federalState.id,
    });
    const characters = _characters.filter((c) => c.name !== '');
    const enrichedCharacters = await enrichCharactersWithImage({ characters });

    return (
      <CharacterOverview
        characters={enrichedCharacters}
        activeFilter={filter}
        currentUserId={user.id}
      />
    );
  }

  const accessLevel = searchParams.visibility;
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const _characters = await getCharacterByAccessLevel({
    accessLevel,
    schoolId: school.id,
    userId: user.id,
    federalStateId: federalState.id,
  });
  const characters = _characters.filter((c) => c.name !== '');
  const enrichedCharacters = await enrichCharactersWithImage({ characters });

  return (
    <CharacterPreviewPage
      user={userAndContext}
      characters={enrichedCharacters}
      accessLevel={accessLevel}
    />
  );
}
