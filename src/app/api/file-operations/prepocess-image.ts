import { FileMetadata, FileModel } from '@/db/schema';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import { isImageFile } from '@/utils/files/generic';
import { ImageAttachment } from '@/utils/files/types';
import sharp from 'sharp';

/**
 * fetch the signed url for the image files and return them as ImageAttachment
 */
export async function extractImagesAndUrl(
  relatedFileEntities: (FileModel & { conversationMessageId?: string })[],
): Promise<ImageAttachment[]> {
  const imageFiles = relatedFileEntities.filter((file) => isImageFile(file.name));

  if (imageFiles.length === 0) {
    return [];
  }

  const imagePromises = imageFiles.map(async (file) => {
    try {
      const url = await getMaybeSignedUrlFromS3Get({ key: `message_attachments/${file.id}` });

      return {
        type: 'image' as const,
        url,
        mimeType: `image/${file.type}`,
        id: file.id,
        conversationMessageId: file.conversationMessageId,
      };
    } catch (error) {
      console.error(`Failed to process image file ${file.id}:`, error);
      return null;
    }
  });

  const images = await Promise.all(imagePromises);
  return images.filter((img) => img != null) as ImageAttachment[];
}

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
