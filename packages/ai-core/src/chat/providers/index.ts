import { constructAzureTextGenerationFn, constructAzureTextStreamFn } from './azure';
import { constructIonosTextGenerationFn, constructIonosTextStreamFn } from './ionos';
import { constructOpenAiTextGenerationFn, constructOpenAiTextStreamFn } from './openai';
import { TextGenerationFn, TextStreamFn, AiModel } from '../types';
import { ProviderConfigurationError } from '../../errors';

function getTextGenerationFnByModel({ model }: { model: AiModel }): TextGenerationFn | undefined {
  if (model.provider === 'azure') {
    return constructAzureTextGenerationFn(model);
  }
  if (model.provider === 'ionos') {
    return constructIonosTextGenerationFn(model);
  }
  if (model.provider === 'openai') {
    return constructOpenAiTextGenerationFn(model);
  }

  return undefined;
}

function getTextStreamFnByModel({ model }: { model: AiModel }): TextStreamFn | undefined {
  if (model.provider === 'azure') {
    return constructAzureTextStreamFn(model);
  }
  if (model.provider === 'ionos') {
    return constructIonosTextStreamFn(model);
  }
  if (model.provider === 'openai') {
    return constructOpenAiTextStreamFn(model);
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
  onComplete?: Parameters<TextStreamFn>[1],
) {
  const streamFn = getTextStreamFnByModel({ model });
  if (!streamFn) {
    throw new ProviderConfigurationError(
      `No text stream function found for provider: ${model.provider}`,
    );
  }
  return streamFn({ messages, model: model.name }, onComplete);
}
