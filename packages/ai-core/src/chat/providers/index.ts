import {
  constructAzureChatCompletionGenerationFn,
  constructAzureChatCompletionStreamFn,
  constructAzureResponsesGenerationFn,
  constructAzureResponsesStreamFn,
} from './azure';
import { constructIonosTextGenerationFn, constructIonosTextStreamFn } from './ionos';
import { constructOpenAITextGenerationFn, constructOpenAITextStreamFn } from './openai';
import { TextGenerationFn, TextStreamFn, AiModel } from '../types';
import { ProviderConfigurationError } from '../../errors';

function getTextGenerationFnByModel({ model }: { model: AiModel }): TextGenerationFn | undefined {
  if (model.provider === 'azure') {
    if (['gpt-5', 'gpt-5-mini', 'gpt-5-nano'].includes(model.name)) {
      return constructAzureResponsesGenerationFn(model);
    }
    return constructAzureChatCompletionGenerationFn(model);
  }
  if (model.provider === 'ionos') {
    return constructIonosTextGenerationFn(model);
  }
  if (model.provider === 'openai') {
    return constructOpenAITextGenerationFn(model);
  }

  return undefined;
}

function getTextStreamFnByModel({ model }: { model: AiModel }): TextStreamFn | undefined {
  if (model.provider === 'azure') {
    // GPT-5 is used with Responses endpoint
    if (['gpt-5', 'gpt-5-mini', 'gpt-5-nano'].includes(model.name)) {
      return constructAzureResponsesStreamFn(model);
    }
    return constructAzureChatCompletionStreamFn(model);
  }
  if (model.provider === 'ionos') {
    return constructIonosTextStreamFn(model);
  }
  if (model.provider === 'openai') {
    return constructOpenAITextStreamFn(model);
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
