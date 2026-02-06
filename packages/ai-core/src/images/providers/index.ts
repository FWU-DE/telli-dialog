import { constructIonosImageGenerationFn } from './ionos';
import { ImageGenerationFn, AiModel } from '../types';
import { constructAzureImageGenerationFn } from './azure';
import { constructGoogleImageGenerationFn } from './google';
import { ProviderConfigurationError } from '../../errors';

// This could probably be more direct, but it would require reworking the individual provider files
function getImageGenerationFnByModel({ model }: { model: AiModel }): ImageGenerationFn | undefined {
  if (model.provider === 'ionos') {
    return constructIonosImageGenerationFn(model);
  }
  if (model.provider === 'azure') {
    return constructAzureImageGenerationFn(model);
  }
  if (model.provider === 'google') {
    return constructGoogleImageGenerationFn(model);
  }

  return undefined;
}

export async function generateImage(model: AiModel, prompt: string) {
  const generationFn = getImageGenerationFnByModel({ model });
  if (!generationFn) {
    throw new ProviderConfigurationError(
      `No image generation function found for provider: ${model.provider}`,
    );
  }
  return generationFn({ prompt, model: model.name });
}
