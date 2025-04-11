import { CharacterAccessLevel, CharacterModel } from '@/db/schema';
import { getMaybeSignedUrlFromS3Get } from '@/s3';

export function buildGenericUrl(accessLevel: CharacterAccessLevel, route: string) {
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
      maybeSignedPictureUrl: await getMaybeSignedUrlFromS3Get({ key: character.pictureId }),
    })),
  );
}
