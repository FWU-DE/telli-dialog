import type { LlmModelSelectModel } from '@shared/db/schema';
import { ImageAspectRatioPreset } from './image-generation-types';

export function getSizeFromAspectRatio(
  model: Pick<LlmModelSelectModel, 'imageGenerationConfig'>,
  aspectRatio: ImageAspectRatioPreset,
): string {
  const aspectRatioOptions = model.imageGenerationConfig?.aspectRatio;
  return aspectRatioOptions?.[aspectRatio] ?? 'auto';
}

export function getAspectRatioFromSize(size?: string): ImageAspectRatioPreset {
  if (!size || size === 'auto') {
    return 'quadratic';
  }

  const [widthValue, heightValue] = size.split('x');
  const width = Number(widthValue);
  const height = Number(heightValue);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 'quadratic';
  }

  if (width === height) {
    return 'quadratic';
  }

  return width > height ? 'landscape' : 'portrait';
}
