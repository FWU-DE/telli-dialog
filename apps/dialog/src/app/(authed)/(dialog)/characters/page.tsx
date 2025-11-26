import { getUser } from '@/auth/utils';
import {
  dbGetCharactersBySchoolId,
  dbGetCharactersByUserId,
  dbGetGlobalCharacters,
} from '@shared/db/functions/character';
import {
  type CharacterAccessLevel,
  type CharacterSelectModel,
  characterAccessLevelSchema,
} from '@shared/db/schema';
import CharacterPreviewPage from './charcter-preview-page';
import { enrichCharactersWithImage } from './utils';
import z from 'zod';

export const dynamic = 'force-dynamic';

export const searchParamsSchema = z.object({
  visibility: characterAccessLevelSchema.optional().default('private'),
});

export default async function Page(props: PageProps<'/characters'>) {
  const searchParams = searchParamsSchema.parse(await props.searchParams);
  const accessLevel = searchParams.visibility;

  const user = await getUser();

  const _characters = await getCharacterByAccessLevel({
    accessLevel,
    schoolId: user.school?.id,
    userId: user.id,
    federalStateId: user.federalState?.id,
  });
  const characters = _characters.filter((c) => c.name !== '');

  const enrichedCharacters = await enrichCharactersWithImage({ characters });

  return (
    <CharacterPreviewPage user={user} characters={enrichedCharacters} accessLevel={accessLevel} />
  );
}

async function getCharacterByAccessLevel({
  accessLevel,
  schoolId,
  userId,
  federalStateId,
}: {
  accessLevel: CharacterAccessLevel;
  schoolId: string | undefined;
  userId: string;
  federalStateId: string;
}): Promise<CharacterSelectModel[]> {
  if (accessLevel === 'global') {
    return await dbGetGlobalCharacters({ userId, federalStateId });
  }

  if (accessLevel === 'school' && schoolId !== undefined) {
    return await dbGetCharactersBySchoolId({ schoolId, userId });
  }

  if (accessLevel === 'private') {
    return await dbGetCharactersByUserId({ userId });
  }

  return [];
}
