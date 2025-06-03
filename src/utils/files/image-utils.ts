import { convertToPixelCrop, PercentCrop, PixelCrop } from 'react-image-crop';
import { SUPPORTED_IMAGE_EXTENSIONS } from '@/const';
import { getFileExtension } from './generic';

export type CompressionOptions =
  | { quality: number }
  | { maxWidth: number }
  | { maxHeight: number }
  | { maxWidth: number; maxHeight: number };

export async function getCompressedImageBlob(
  source: HTMLImageElement | HTMLCanvasElement,
  options?: CompressionOptions,
): Promise<Blob> {
  const width = source instanceof HTMLImageElement ? source.width : source.width;
  const height = source instanceof HTMLImageElement ? source.height : source.height;

  const { newWidth, newHeight, quality } = processOptions(
    { width, height } as HTMLImageElement,
    options,
  );

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Couldn't get the canvas context");

  if (source instanceof HTMLImageElement) {
    ctx.drawImage(source, 0, 0, newWidth, newHeight);
  } else {
    ctx.drawImage(source, 0, 0, newWidth, newHeight);
  }

  return await canvasToBlob(canvas, quality);
}

function processOptions(image: HTMLImageElement, options?: CompressionOptions) {
  const defaultQuality = 1;
  let quality = defaultQuality;
  let newWidth = image.width;
  let newHeight = image.height;

  if (options) {
    if ('quality' in options) {
      quality = validateQuality(options.quality);
    }

    const dimensions = calculateDimensions(image, options);
    if (dimensions) {
      newWidth = dimensions.width;
      newHeight = dimensions.height;
    }
  }

  return { newWidth, newHeight, quality };
}

function calculateDimensions(
  image: HTMLImageElement,
  options: CompressionOptions,
): { width: number; height: number } | null {
  const originalWidth = image.width;
  const originalHeight = image.height;

  if ('maxWidth' in options && 'maxHeight' in options) {
    const widthRatio = options.maxWidth / originalWidth;
    const heightRatio = options.maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  } else if ('maxWidth' in options) {
    const ratio = options.maxWidth / originalWidth;

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  } else if ('maxHeight' in options) {
    const ratio = options.maxHeight / originalHeight;

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }

  return null;
}

function validateQuality(quality: number): number {
  if (quality < 0 || quality > 1) {
    throw new Error('Quality must be a number between 0 and 1.');
  }

  return quality;
}

export function createCanvasWithImage(
  image: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  ctx.drawImage(image, 0, 0, width, height);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/webp',
      quality,
    );
  });
}

export async function getCroppedImageBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  scale: number = 1,
  rotate: number = 0,
  compressionOptions?: CompressionOptions,
): Promise<Blob> {
  if (!image || !crop.width || !crop.height) {
    throw new Error('Image or crop data is missing');
  }
  const croppedCanvas = createCroppedCanvas(image, crop, scale, rotate);
  return await getCompressedImageBlob(croppedCanvas, compressionOptions);
}

function createCroppedCanvas(
  image: HTMLImageElement,
  crop: PixelCrop,
  scale: number,
  rotate: number,
): HTMLCanvasElement {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context is not available');
  }

  canvas.width = crop.width * scaleX * scale;
  canvas.height = crop.height * scaleY * scale;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (rotate !== 0) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas;
}

export function getConvertedPixelCrop(
  image: HTMLImageElement,
  percentCrop: PercentCrop,
): PixelCrop {
  const { width, height } = image;
  return convertToPixelCrop(percentCrop, width, height);
}

export function isImageFile(fileName: string): boolean {
  try {
    const extension = getFileExtension(fileName);
    return SUPPORTED_IMAGE_EXTENSIONS.includes(extension as any);
  } catch {
    return false;
  }
}
