import { FileModel } from '@shared/db/schema';
import type { ImageAspectRatioPreset } from '@shared/utils/chat';

export type { ImageAspectRatioPreset };

export type ImageGenerationOptions = {
  aspectRatio: ImageAspectRatioPreset;
};

export type ImageVersion = {
  userMessageId: string;
  assistantMessageId: string;
  prompt: string;
  imageUrl: string;
  imageFileId: string;
  attachedFiles: FileModel[];
  orderNumber: number;
};
