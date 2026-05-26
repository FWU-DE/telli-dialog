import {
  constructAzureChatCompletionGenerationFn,
  constructAzureChatCompletionStreamFn,
  constructAzureResponsesGenerationFn,
  constructAzureResponsesStreamFn,
  constructAzureResponsesToolStreamFn,
} from './azure';
import { constructGoogleTextGenerationFn, constructGoogleTextStreamFn } from './google';
import { constructIonosTextGenerationFn, constructIonosTextStreamFn } from './ionos';
import { constructOpenAITextGenerationFn, constructOpenAITextStreamFn } from './openai';
import type {
  AgenticStreamFn,
  AiModel,
  GenerationOptions,
  StreamEvent,
  TextGenerationFn,
  TextStreamFn,
  TokenUsage,
} from '../types';
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
  if (model.provider === 'google') {
    return constructGoogleTextGenerationFn(model);
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
  if (model.provider === 'google') {
    return constructGoogleTextStreamFn(model);
  }
  if (model.provider === 'openai') {
    return constructOpenAITextStreamFn(model);
  }

  return undefined;
}

function getToolStreamFnByModel({ model }: { model: AiModel }): AgenticStreamFn | undefined {
  if (model.provider === 'azure') {
    return constructAzureResponsesToolStreamFn(model);
  }
  return undefined; // TODO: Add support for other providers
}

export async function generateText(
  model: AiModel,
  messages: Parameters<TextGenerationFn>[0]['messages'],
  options?: GenerationOptions,
) {
  const generationFn = getTextGenerationFnByModel({ model });
  if (!generationFn) {
    throw new ProviderConfigurationError(
      `No text generation function found for provider: ${model.provider}`,
    );
  }
  return generationFn({ messages, model: model.name, ...options });
}

export function generateTextStream(
  model: AiModel,
  messages: Parameters<TextStreamFn>[0]['messages'],
  onComplete?: Parameters<TextStreamFn>[1],
  options?: GenerationOptions,
): AsyncGenerator<string> {
  if (!options?.tools) {
    const streamFn = getTextStreamFnByModel({ model });
    if (!streamFn) {
      throw new ProviderConfigurationError(
        `No text stream function found for provider: ${model.provider}`,
      );
    }
    return streamFn({ messages, model: model.name, ...options }, onComplete);
  }

  const streamFn = getToolStreamFnByModel({ model });
  if (!streamFn) {
    throw new ProviderConfigurationError(
      `No tool stream function found for provider: ${model.provider}`,
    );
  }
  // The agentic loop will have to take care of this too
  return filterToolStreamToText(streamFn({ messages, model: model.name, ...options }), onComplete);
}

async function* filterToolStreamToText(
  stream: AsyncGenerator<StreamEvent>,
  onComplete?: (usage: TokenUsage) => void | Promise<void>,
): AsyncGenerator<string> {
  let usage: TokenUsage | undefined;

  for await (const event of stream) {
    if (event.type === 'text') {
      yield event.delta;
      continue;
    }

    if (event.type === 'finish') {
      usage = event.usage;
    }
  }

  if (usage && onComplete) {
    await onComplete(usage);
  }
}
