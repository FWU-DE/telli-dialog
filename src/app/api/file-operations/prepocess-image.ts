import { FileMetadata } from '@/db/schema';
import sharp from 'sharp';

export async function preprocessImage(
  fileContent: Buffer,
): Promise<{ buffer: Buffer; metadata: FileMetadata }> {
  const metadata = await sharp(fileContent).metadata();

  let width = metadata.width ?? 0;
  let height = metadata.height ?? 0;
  if (height > 720) {
    const aspectRatio = width / height;
    height = 720;
    width = Math.round(height * aspectRatio);

    // Process the image with scaling
    const processedBuffer = await sharp(fileContent)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();

    return {
      buffer: processedBuffer,
      metadata: { width, height },
    };
  }

  // Return original buffer if no scaling needed
  return {
    buffer: fileContent,
    metadata: { width, height },
  };
}
