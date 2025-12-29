import OpenAI from 'openai';
import type { AiModel, TextStreamFn, TextGenerationFn, TokenUsage } from '../types';
import { ProviderConfigurationError } from '../../errors';
import { calculateCompletionUsage } from '../utils';

function createIonosClient(model: AiModel): OpenAI {
  if (model.setting.provider !== 'ionos') {
    throw new ProviderConfigurationError('Invalid model configuration for IONOS');
  }

  return new OpenAI({
    apiKey: model.setting.apiKey,
    baseURL: model.setting.baseUrl,
  });
}

export function constructIonosTextStreamFn(model: AiModel): TextStreamFn {
  const client = createIonosClient(model);

  return async function* getIonosTextStream({ messages, model: modelName, maxTokens }, onComplete) {
    const stream = await client.chat.completions.create({
      model: modelName,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: maxTokens,
    });

    let content = '';

    for await (const chunk of stream) {
      const chunkContent = chunk.choices[0]?.delta?.content;

      if (chunkContent) {
        content += chunkContent;
        yield chunkContent;
      }
    }

    // Calculate the token usage manually as IONOS does not return it
    // TODO: add token count for image inputs. See guide for token count calculation https://platform.openai.com/docs/guides/images-vision?api-mode=responses&format=file
    const calculatedUsage = calculateCompletionUsage({
      messages,
      modelMessage: { role: 'assistant', content },
    });

    const usage: TokenUsage = {
      completionTokens: calculatedUsage.completion_tokens,
      promptTokens: calculatedUsage.prompt_tokens,
      totalTokens: calculatedUsage.total_tokens,
    };

    if (onComplete) {
      await onComplete(usage);
    }
  };
}

export function constructIonosTextGenerationFn(model: AiModel): TextGenerationFn {
  const client = createIonosClient(model);

  return async function getIonosTextGeneration({ messages, model: modelName, maxTokens }) {
    const response = await client.chat.completions.create({
      model: modelName,
      messages,
      stream: false,
      max_tokens: maxTokens,
    });

    const text = response.choices[0]?.message?.content ?? '';

    // Calculate the token usage manually as IONOS does not return it reliably
    const calculatedUsage = calculateCompletionUsage({
      messages,
      modelMessage: { role: 'assistant', content: text },
    });

    return {
      text,
      usage: {
        completionTokens: calculatedUsage.completion_tokens,
        promptTokens: calculatedUsage.prompt_tokens,
        totalTokens: calculatedUsage.total_tokens,
      },
    };
  };
}
