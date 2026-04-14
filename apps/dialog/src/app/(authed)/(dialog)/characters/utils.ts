import { CharacterOptionalShareDataModel } from '@shared/db/schema';
import { getAvatarPictureUrl } from '@shared/files/fileService';

export type CharacterWithImage = CharacterOptionalShareDataModel & {
  maybeSignedPictureUrl: string | undefined;
};

export async function enrichCharactersWithImage({
  characters,
}: {
  characters: CharacterOptionalShareDataModel[];
}): Promise<CharacterWithImage[]> {
  return await Promise.all(
    characters.map(async (character) => ({
      ...character,
      maybeSignedPictureUrl: await getAvatarPictureUrl(character.pictureId),
    })),
  );
}
