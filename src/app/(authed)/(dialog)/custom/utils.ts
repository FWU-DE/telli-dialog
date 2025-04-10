import { CharacterAccessLevel, CharacterModel } from '@/db/schema';
import { getMaybeSignedUrlFromS3Get } from '@/s3';

export function buildCharactersUrl(accessLevel: CharacterAccessLevel) {
  const searchParams = new URLSearchParams();
  searchParams.set('visibility', accessLevel);
  return `/characters?${searchParams.toString()}`;
}

export type CharacterWithImage = CharacterModel & { maybeSignedPictureUrl: string | undefined };

export async function enrichGptWithImage({
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
