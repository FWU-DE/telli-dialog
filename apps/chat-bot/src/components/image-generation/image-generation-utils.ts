import { LlmModelSelectModel } from '@shared/db/schema';
import { ImageAspectRatioPreset } from './image-generation-types';

export function getSizeFromAspectRatio(
  model: Pick<LlmModelSelectModel, 'imageGenerationConfig'>,
  aspectRatio: ImageAspectRatioPreset,
): string {
  const aspectRatioOptions = model.imageGenerationConfig?.aspectRatio;
  return aspectRatioOptions?.[aspectRatio] ?? 'auto';
}
