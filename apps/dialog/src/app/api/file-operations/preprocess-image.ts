import { SUPPORTED_DOCUMENTS_TYPE, TRUNCATE_IMAGE_HEIGHT } from '@/const';
import { FileMetadata, FileModel } from '@shared/db/schema';
import { getReadOnlySignedUrl } from '@shared/s3';
import { isImageFile } from '@/utils/files/generic';
import { ImageAttachment } from '@/utils/files/types';
import sharp from 'sharp';
import { logError } from '@shared/logging';

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
      const url = await getReadOnlySignedUrl({ key: `message_attachments/${file.id}` });

      return {
        type: 'image' as const,
        url,
        mimeType: `image/${file.type}`,
        id: file.id,
        conversationMessageId: file.conversationMessageId,
      };
    } catch (error) {
      logError(`Failed to process image file ${file.id}`, error);
      return null;
    }
  });

  const images = await Promise.all(imagePromises);
  return images.filter((img) => img !== null) as ImageAttachment[];
}

export async function preprocessImage(
  fileContent: Buffer,
  type: SUPPORTED_DOCUMENTS_TYPE,
): Promise<{ buffer: Buffer; metadata: FileMetadata }> {
  // Convert SVG to PNG if needed
  let processedBuffer = fileContent;
  if (type === 'svg') {
    try {
      processedBuffer = await sharp(fileContent).png().toBuffer();
    } catch {
      throw new Error('Failed to convert SVG to PNG');
    }
  }

  const metadata = await sharp(processedBuffer).metadata();

  let width = metadata.width ?? 0;
  let height = metadata.height ?? 0;
  if (height > TRUNCATE_IMAGE_HEIGHT) {
    const aspectRatio = width / height;
    height = TRUNCATE_IMAGE_HEIGHT;
    width = Math.round(height * aspectRatio);

    // Process the image with scaling
    const finalBuffer = await sharp(processedBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();

    return {
      buffer: finalBuffer,
      metadata: { width, height },
    };
  }

  // Return processed buffer (converted from SVG if needed) if no scaling needed
  return {
    buffer: processedBuffer,
    metadata: { width, height },
  };
}
