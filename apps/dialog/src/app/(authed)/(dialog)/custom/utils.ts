import { CustomGptSelectModel } from '@shared/db/schema';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';

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
      // Do not use the function getMaybeSignedUrlIfExists here it will end up in a client side error
      // TODO: find a workaround to test if image exists and show a placeholder if it does not
      maybeSignedPictureUrl: await getMaybeSignedUrlFromS3Get({ key: gpt.pictureId }),
    })),
  );
}
