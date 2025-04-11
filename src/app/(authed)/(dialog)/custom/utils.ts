import { CustomGptModel } from '@/db/schema';
import { getMaybeSignedUrlFromS3Get } from '@/s3';

export type CustomGptWithImage = CustomGptModel & { maybeSignedPictureUrl: string | undefined };

export async function enrichGptWithImage({
  customGpts,
}: {
  customGpts: CustomGptModel[];
}): Promise<CustomGptWithImage[]> {
  return await Promise.all(
    customGpts.map(async (gpt) => ({
      ...gpt,
      maybeSignedPictureUrl: await getMaybeSignedUrlFromS3Get({ key: gpt.pictureId }),
    })),
  );
}
