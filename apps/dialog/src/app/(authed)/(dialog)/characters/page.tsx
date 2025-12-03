import { characterAccessLevelSchema } from '@shared/db/schema';
import CharacterPreviewPage from './charcter-preview-page';
import { enrichCharactersWithImage } from './utils';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { getCharacterByAccessLevel } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';

export const dynamic = 'force-dynamic';

export const searchParamsSchema = z.object({
  visibility: characterAccessLevelSchema.optional().default('private'),
});

export default async function Page(props: PageProps<'/characters'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const accessLevel = searchParams.visibility;
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const _characters = await getCharacterByAccessLevel({
    accessLevel,
    schoolId: school?.id,
    userId: user.id,
    federalStateId: federalState?.id,
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
