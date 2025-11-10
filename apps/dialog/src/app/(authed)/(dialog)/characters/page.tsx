import { getUser } from '@/auth/utils';
import {
  dbGetCharactersBySchoolId,
  dbGetCharactersByUserId,
  dbGetGlobalCharacters,
} from '@shared/db/functions/character';
import {
  type CharacterAccessLevel,
  type CharacterModel,
  characterAccessLevelSchema,
} from '@shared/db/schema';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { z } from 'zod';
import CharacterPreviewPage from './charcter-preview-page';
import { enrichCharactersWithImage } from './utils';

export const dynamic = 'force-dynamic';

const pageContextSchema = z.object({
  searchParams: z.object({
    visibility: characterAccessLevelSchema.default('private'),
  }),
});

export default async function Page(context: PageContext) {
  const {
    searchParams: { visibility: accessLevel },
  } = pageContextSchema.parse(await awaitPageContext(context));

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
}): Promise<CharacterModel[]> {
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
