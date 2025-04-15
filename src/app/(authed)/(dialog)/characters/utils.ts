import { dbGetCopyTemplateCharacter } from '@/db/functions/character';
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
      maybeSignedPictureUrl: await getMaybeSignedUrlFromS3Get({ key: character.pictureId }),
    })),
  );
}

export async function getMaybeDefaultTemplateCharater({
  templateId,
  characterId,
  userId,
}: {
  templateId?: string;
  characterId: string;
  userId: string;
}) {
  if (templateId === undefined) return undefined;
  return await dbGetCopyTemplateCharacter({
    templateId,
    characterId: characterId,
    userId: userId,
  });
}
