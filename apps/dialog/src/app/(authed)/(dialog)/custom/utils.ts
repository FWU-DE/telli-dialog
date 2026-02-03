import { CustomGptSelectModel } from '@shared/db/schema';
import { getAvatarPictureUrl } from '@shared/files/fileService';

export type CustomGptWithImage = CustomGptSelectModel & {
  maybeSignedPictureUrl: string | undefined;
};

export async function enrichGptWithImage({
  customGpts,
}: {
  customGpts: CustomGptSelectModel[];
}): Promise<CustomGptWithImage[]> {
  return await Promise.all(
    customGpts.map(async (gpt) => ({
      ...gpt,
      maybeSignedPictureUrl: await getAvatarPictureUrl(gpt.pictureId),
    })),
  );
}
