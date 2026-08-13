import { LlmModelSelectModel } from '@shared/db/schema';
import { ImageAspectRatioPreset } from './image-generation-types';

export function getSizeFromAspectRatio(
  model: Pick<LlmModelSelectModel, 'imageGenerationOptions'>,
  aspectRatio: ImageAspectRatioPreset,
): string {
  const aspectRatioOptions = model.imageGenerationOptions?.aspectRatio;
  return aspectRatioOptions?.[aspectRatio] ?? 'auto';
}
