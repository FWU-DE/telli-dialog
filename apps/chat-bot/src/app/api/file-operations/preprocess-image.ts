import { TRUNCATE_IMAGE_HEIGHT } from '@/const';
import { FileMetadata, FileModel } from '@shared/db/schema';
import { getFileFromS3, getReadOnlySignedUrl } from '@shared/s3';
import { isImageFile } from '@/utils/files/generic';
import sharp from 'sharp';
import { logError } from '@shared/logging';
import { Readable } from 'stream';
import { ChatAttachment } from '@ais-chat/ai-core';

export type ChatAttachmentWithMessageId = ChatAttachment & {
  messageId: string;
};

/**
 * fetch the signed url for the image files and return them as ChatImageAttachment
 */
export async function createImageAttachmentsForConversation(
  relatedFileEntities: (FileModel & { conversationMessageId?: string })[],
  imageAttachmentType: 'url' | 'base64',
): Promise<ChatAttachmentWithMessageId[]> {
  const imageFiles = relatedFileEntities
    .filter((file) => isImageFile(file.name))
    .filter(hasMessageId);

  if (imageFiles.length === 0) {
    return [];
  }

  const imagePromises = imageFiles.map(async (file) => {
    let url: string;
    const contentType = getImageContentType(file.type);

    try {
      if (imageAttachmentType === 'url') {
        url = await getReadOnlySignedUrl({ key: `message_attachments/${file.id}` });
      } else if (imageAttachmentType === 'base64') {
        const fileStream = await getFileFromS3(`message_attachments/${file.id}`);
        const base64ImageData = await streamToBase64(fileStream);
        url = `data:${contentType};base64,${base64ImageData}`;
      } else {
        throw new Error(`Unsupported image attachment type: ${imageAttachmentType}`);
      }

      return {
        type: 'image' as const,
        url,
        contentType,
        messageId: file.conversationMessageId,
      };
    } catch (error) {
      logError(`Failed to process image file ${file.id}`, error);
      return undefined;
    }
  });

  const images = await Promise.all(imagePromises);
  return images.filter((img) => img !== undefined);
}

function getImageContentType(type: string): string {
  return type === 'jpg' ? 'image/jpeg' : `image/${type}`;
}

export async function preprocessImage(
  fileContent: Buffer,
  type: string,
): Promise<{ buffer: Buffer; metadata: FileMetadata; type: string }> {
  // Convert SVG to PNG if needed
  let processedBuffer = fileContent;
  let processedType = type;
  if (type === 'svg') {
    try {
      processedBuffer = await sharp(fileContent).png().toBuffer();
      processedType = 'png';
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
      type: processedType,
    };
  }

  // Return processed buffer (converted from SVG if needed) if no scaling needed
  return {
    buffer: processedBuffer,
    metadata: { width, height },
    type: processedType,
  };
}

async function streamToBase64(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const buffer = Buffer.concat(chunks);

  return buffer.toString('base64');
}

// returns true if the file has a conversationMessageId which is needed to
// associate the image with the correct message in the chat history
// An image file without a conversationMessageId is likely not possible atm.
function hasMessageId(
  file: FileModel & { conversationMessageId?: string },
): file is FileModel & { conversationMessageId: string } {
  return file.conversationMessageId !== undefined;
}
