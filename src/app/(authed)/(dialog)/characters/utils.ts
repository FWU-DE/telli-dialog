import { CharacterAccessLevel, CharacterModel } from '@/db/schema';
import { getMaybeSignedUrlFromS3Get } from '@/s3';

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
      // Do not use the function getMaybeSignedUrlIfExists here it will end up in a client side error
      // TODO: find a workaround to test if image exists and show a placeholder if it does not
      maybeSignedPictureUrl: await getMaybeSignedUrlFromS3Get({ key: character.pictureId }),
    })),
  );
}
