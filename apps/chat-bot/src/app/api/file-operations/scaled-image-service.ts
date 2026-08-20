import sharp from 'sharp';
import { getFileFromS3 } from '@shared/s3';
import { getImageContentType, streamToBuffer } from '@/utils/files/image-data';

const MAX_SCALED_IMAGE_SIZE = 1_000;

export async function createScaledImage({
  fileId,
  width,
  height,
}: {
  fileId: string;
  width?: number;
  height?: number;
}): Promise<{ buffer: Buffer; contentType: string }> {
  const imageStream = await getFileFromS3(`message_attachments/${fileId}`);
  const imageBuffer = await streamToBuffer(imageStream);
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const resizeOptions = {
    ...(width !== undefined ? { width: Math.min(width, MAX_SCALED_IMAGE_SIZE) } : {}),
    ...(height !== undefined ? { height: Math.min(height, MAX_SCALED_IMAGE_SIZE) } : {}),
    fit: 'inside' as const,
    withoutEnlargement: true,
  };

  const buffer =
    width === undefined && height === undefined
      ? imageBuffer
      : await image.resize(resizeOptions).toBuffer();

  return {
    buffer,
    contentType: getImageContentType(metadata.format) ?? '',
  };
}
