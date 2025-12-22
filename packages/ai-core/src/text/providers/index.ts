import { constructAzureTextGenerationFn, constructAzureTextStreamFn } from './azure';
import { TextGenerationFn, TextStreamFn, AiModel } from '../types';
import { ProviderConfigurationError } from '../../errors';

function getTextGenerationFnByModel({ model }: { model: AiModel }): TextGenerationFn | undefined {
  if (model.provider === 'azure') {
    return constructAzureTextGenerationFn(model);
  }

  return undefined;
}

function getTextStreamFnByModel({ model }: { model: AiModel }): TextStreamFn | undefined {
  if (model.provider === 'azure') {
    return constructAzureTextStreamFn(model);
  }

  return undefined;
}

export async function generateText(model: AiModel, prompt: string, history?: Parameters<TextGenerationFn>[0]['history']) {
  const generationFn = getTextGenerationFnByModel({ model });
  if (!generationFn) {
    throw new ProviderConfigurationError(
      `No text generation function found for provider: ${model.provider}`,
    );
  }
  return generationFn({ prompt, model: model.name, history });
}

export function generateTextStream(model: AiModel, prompt: string, history?: Parameters<TextStreamFn>[0]['history']) {
  const streamFn = getTextStreamFnByModel({ model });
  if (!streamFn) {
    throw new ProviderConfigurationError(
      `No text stream function found for provider: ${model.provider}`,
    );
  }
  return streamFn({ prompt, model: model.name, history });
}
