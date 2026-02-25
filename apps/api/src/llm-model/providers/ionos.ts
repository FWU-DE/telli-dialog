import { OpenAI as OpenAIv4 } from 'openaiv4';
import OpenAI from 'openai';
import { streamToController } from '../utils';
import {
  CommonLlmProviderStreamParameter,
  CompletionFn,
  CompletionStreamFn,
  EmbeddingFn,
  ImageGenerationFn,
} from '../types';
import { LlmModel } from '@telli/api-database';
import { calculateCompletionUsage } from '../utils';
import { CompletionUsage } from 'openai/resources/completions.js';

export function constructIonosCompletionStreamFn(llmModel: LlmModel): CompletionStreamFn {
  if (llmModel.setting.provider !== 'ionos' || !llmModel.setting) {
    throw new Error('Invalid model configuration for IONOS');
  }

  const client = new OpenAI({
    apiKey: llmModel.setting.apiKey,
    baseURL: llmModel.setting.baseUrl,
  });

  return async function getIonosCompletionStream({
    onUsageCallback,
    messages,
    ...props
  }: Omit<CommonLlmProviderStreamParameter, 'model'>): ReturnType<CompletionStreamFn> {
    const stream = await client.chat.completions.create({
      model: llmModel.id,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      ...props,
    });

    async function* fetchChunks() {
      let content = '';
      let firstChunk: OpenAI.Chat.Completions.ChatCompletionChunk | null = null;
      for await (const chunk of stream) {
        if (firstChunk === null) {
          firstChunk = chunk;
        }
        const maybeContent = chunk.choices[0]?.delta.content;
        if (maybeContent) {
          content += maybeContent;
        }
        yield JSON.stringify(chunk);
      }
      // calculate the token usage manually as ionos does not return it
      // TODO: add token count for image inputs. See guide for token count calculation https://platform.openai.com/docs/guides/images-vision?api-mode=responses&format=file
      const usage = calculateCompletionUsage({
        messages,
        modelMessage: { role: 'assistant', content },
      });
      onUsageCallback(usage);
      // we need to manually construct an openai compatible chunk which includes the usage
      if (firstChunk !== null) {
        yield JSON.stringify({
          id: firstChunk.id,
          model: firstChunk.model,
          created: firstChunk.created,
          choices: [],
          object: firstChunk.object,
          usage,
        });
      }
    }

    return new ReadableStream({
      async start(controller) {
        await streamToController(controller, fetchChunks());
      },
    });
  };
}

export function constructIonosCompletionFn(llmModel: LlmModel): CompletionFn {
  if (llmModel.setting.provider !== 'ionos' || !llmModel.setting) {
    throw new Error('Invalid model configuration for IONOS');
  }

  const client = new OpenAI({
    apiKey: llmModel.setting.apiKey,
    baseURL: llmModel.setting.baseUrl,
  });

  return async function getIonosCompletion({
    ...props
  }: Parameters<CompletionFn>[0]): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const result = await client.chat.completions.create({
      ...props,
    });
    return result;
  };
}

export function constructIonosEmbeddingFn(llmModel: LlmModel) {
  if (llmModel.setting.provider !== 'ionos' || !llmModel.setting) {
    throw new Error('Invalid model configuration for IONOS');
  }

  const client = new OpenAIv4({
    apiKey: llmModel.setting.apiKey,
    baseURL: llmModel.setting.baseUrl,
  });

  return async function getIonosEmbedding({ input, model }: Parameters<EmbeddingFn>[0]): Promise<{
    data: OpenAI.Embeddings.Embedding[];
    usage: CompletionUsage;
    model: string;
  }> {
    if (input.length === 0) {
      return {
        data: [],
        usage: {
          prompt_tokens: 0,
          total_tokens: 0,
          completion_tokens: 0,
        },
        model: llmModel.name,
      };
    }
    const { data, usage } = await client.embeddings.create({
      input,
      model,
      encoding_format: 'float',
    });
    return {
      data,
      usage: { ...usage, completion_tokens: 0 },
      model: llmModel.name,
    };
  };
}

export function constructIonosImageGenerationFn(llmModel: LlmModel): ImageGenerationFn {
  if (llmModel.setting.provider !== 'ionos' || !llmModel.setting) {
    throw new Error('Invalid model configuration for IONOS');
  }

  const client = new OpenAI({
    apiKey: llmModel.setting.apiKey,
    baseURL: llmModel.setting.baseUrl,
  });

  return async function getIonosImageGeneration({
    prompt,
    model,
  }: Parameters<ImageGenerationFn>[0]) {
    const result = await client.images.generate({
      model,
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    });

    return result;
  };
}
