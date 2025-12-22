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

export async function generateText(
  model: AiModel,
  messages: Parameters<TextGenerationFn>[0]['messages'],
) {
  const generationFn = getTextGenerationFnByModel({ model });
  if (!generationFn) {
    throw new ProviderConfigurationError(
      `No text generation function found for provider: ${model.provider}`,
    );
  }
  return generationFn({ messages, model: model.name });
}

export function generateTextStream(
  model: AiModel,
  messages: Parameters<TextStreamFn>[0]['messages'],
) {
  const streamFn = getTextStreamFnByModel({ model });
  if (!streamFn) {
    throw new ProviderConfigurationError(
      `No text stream function found for provider: ${model.provider}`,
    );
  }
  return streamFn({ messages, model: model.name });
}
