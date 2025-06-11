import { CharacterAccessLevel, CharacterModel } from '@/db/schema';
import { getMaybeSignedUrlIfExists } from '@/s3';

export function buildGenericUrl(accessLevel: CharacterAccessLevel, route: 'characters' | 'custom') {
  const searchParams = new URLSearchParams();
  searchParams.set('visibility', accessLevel);
  return `/${route}?${searchParams.toString()}`;
}

export type CharacterWithImage = CharacterModel & { maybeSignedPictureUrl: string | undefined };

export async function enrichCharactersWithImage({
  characters,
}: {
  characters: CharacterModel[];
}): Promise<CharacterWithImage[]> {
  return await Promise.all(
    characters.map(async (character) => ({
      ...character,
      maybeSignedPictureUrl: await getMaybeSignedUrlIfExists({ key: character.pictureId }),
    })),
  );
}
