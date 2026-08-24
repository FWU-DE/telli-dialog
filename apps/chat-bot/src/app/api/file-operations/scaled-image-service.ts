import sharp from 'sharp';
import { getFileFromS3 } from '@shared/s3';
import { getImageContentType, streamToBuffer } from '@/utils/files/image-data';

export async function createScaledImage({
  fileId,
  width,
  height,
}: {
  fileId: string;
  width: number;
  height: number;
}): Promise<{ buffer: Buffer; contentType: string }> {
  const imageStream = await getFileFromS3(`message_attachments/${fileId}`);
  const imageBuffer = await streamToBuffer(imageStream);
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const resizeOptions = {
    width: width,
    height: height,
    fit: 'inside' as const,
    withoutEnlargement: true,
  };

  const buffer = await image.resize(resizeOptions).toBuffer();

  return {
    buffer,
    contentType: getImageContentType(metadata.format) ?? '',
  };
}
