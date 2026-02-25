import OpenAI from 'openai';
import { streamToController } from '../utils';
import {
  CommonLlmProviderStreamParameter,
  CompletionFn,
  CompletionStreamFn,
  ImageGenerationFn,
} from '../types';
import { LlmModel } from '@telli/api-database';
import { CompletionUsage } from 'openai/resources/completions.js';

function createAzureClient(model: LlmModel): {
  client: OpenAI;
  deployment: string;
} {
  if (model.setting.provider !== 'azure') {
    throw new Error('Invalid model configuration for Azure');
  }

  const { basePath, deployment, searchParams } = parseAzureOpenAIUrl({
    baseUrl: model.setting.baseUrl,
  });

  const client = new OpenAI({
    apiKey: model.setting.apiKey,
    baseURL: basePath,
    defaultQuery: Object.fromEntries(searchParams.entries()),
  });

  return { client, deployment };
}

export function constructAzureCompletionStreamFn(model: LlmModel): CompletionStreamFn {
  const { client, deployment } = createAzureClient(model);

  if (['gpt-5', 'gpt-5-mini', 'gpt-5-nano'].includes(model.name)) {
    return async function getAzureCompletionStream({
      onUsageCallback,
      ...props
    }: CommonLlmProviderStreamParameter) {
      const input = chatCompletionsToResponsesInputFormat(props.messages);
      const stream = await client.responses.create(
        {
          max_output_tokens: props.max_tokens,
          input: input,
          model: deployment, // Use the deployment ID as the model
          stream: true,
          store: false,
          ...model.additionalParameters,
        },
        {
          path: `/openai/responses`,
        },
      );

      async function* fetchChunks() {
        const starttime = Date.now();
        for await (const chunk of stream) {
          if (chunk.type === 'response.output_text.delta') {
            // Typing is important here
            const output: OpenAI.Chat.Completions.ChatCompletionChunk = {
              id: chunk.item_id,
              object: 'chat.completion.chunk',
              model: model.name,
              choices: [
                {
                  delta: { content: chunk.delta },
                  index: 0,
                  finish_reason: null,
                  logprobs: null,
                },
              ],
              created: starttime,
            };
            yield JSON.stringify(output);
            continue;
          }
          if (chunk.type === 'response.completed') {
            const usage: CompletionUsage = {
              ...chunk.response.usage,
              prompt_tokens: chunk.response.usage?.input_tokens ?? 0,
              completion_tokens: chunk.response.usage?.output_tokens ?? 0,
              total_tokens: chunk.response.usage?.total_tokens ?? 0,
            };

            onUsageCallback(usage);

            const output: OpenAI.Chat.Completions.ChatCompletionChunk = {
              id: chunk.response.id,
              object: 'chat.completion.chunk',
              model: model.name,
              choices: [{ delta: {}, finish_reason: 'stop', index: 0 }],
              created: starttime,
              usage: usage,
            };
            yield JSON.stringify(output);
            continue;
          }
        }
      }

      return new ReadableStream({
        async start(controller) {
          await streamToController(controller, fetchChunks());
        },
      });
    };
  } else {
    return async function getAzureCompletionStream({
      onUsageCallback,
      ...props
    }: CommonLlmProviderStreamParameter) {
      const stream = await client.chat.completions.create(
        {
          ...props,
          model: deployment, // Use the deployment ID as the model
          stream: true,
          stream_options: {
            include_usage: true,
          },
        },
        {
          path: `/openai/deployments/${deployment}/chat/completions`,
        },
      );

      async function* fetchChunks() {
        for await (const chunk of stream) {
          const maybeUsage = chunk.usage ?? undefined;
          if (maybeUsage !== undefined) {
            onUsageCallback(maybeUsage);
          }
          yield JSON.stringify(chunk);
        }
      }

      return new ReadableStream({
        async start(controller) {
          await streamToController(controller, fetchChunks());
        },
      });
    };
  }
}

export function constructAzureCompletionFn(model: LlmModel): CompletionFn {
  const { client, deployment } = createAzureClient(model);

  return async function getAzureCompletion({ ...props }: Parameters<CompletionFn>[0]) {
    const result = await client.chat.completions.create(
      {
        messages: props.messages,
        max_completion_tokens: props.max_tokens,
        model: deployment, // Use the deployment ID as the model
      },
      {
        path: `/openai/deployments/${deployment}/chat/completions`,
      },
    );

    return result;
  };
}

export function constructAzureImageGenerationFn(model: LlmModel): ImageGenerationFn {
  const { client, deployment } = createAzureClient(model);

  return async function getAzureImageGeneration(params: Parameters<ImageGenerationFn>[0]) {
    const { prompt } = params;
    const result = await client.images.generate(
      {
        prompt,
        size: '1024x1024',
        n: 1,
        quality: 'standard',
        style: 'vivid',
        response_format: 'b64_json',
      },
      {
        path: `/openai/deployments/${deployment}/images/generations`,
      },
    );

    return result;
  };
}

function parseAzureOpenAIUrl({ baseUrl }: { baseUrl: string }): {
  basePath: string;
  deployment: string;
  searchParams: URLSearchParams;
} {
  // Extract query parameters if they exist
  const [urlWithoutQuery, ...queryString] = baseUrl.split('?');

  if (urlWithoutQuery === undefined) {
    throw new Error(
      'Invalid Azure baseUrl format. Expected format: https://{endpoint}.openai.azure.com/openai/deployments/{deployment-id}',
    );
  }

  const searchParams = new URLSearchParams(queryString.join('?'));

  const urlParts = urlWithoutQuery.split('/');
  const deploymentIndex = urlParts.findIndex((part) => part === 'deployments');

  if (deploymentIndex === -1 || deploymentIndex >= urlParts.length - 1) {
    throw new Error(
      'Invalid Azure baseUrl format. Expected format: https://{endpoint}.openai.azure.com/openai/deployments/{deployment-id}',
    );
  }

  const deployment = urlParts[deploymentIndex + 1];
  if (deployment === undefined) {
    throw new Error(
      'Invalid Azure baseUrl format. Expected format: https://{endpoint}.openai.azure.com/openai/deployments/{deployment-id}',
    );
  }
  const basePath = urlParts.slice(0, deploymentIndex - 1).join('/');

  return { basePath, deployment, searchParams };
}

function chatCompletionsToResponsesInputFormat(
  input: CommonLlmProviderStreamParameter['messages'],
): OpenAI.Responses.ResponseInputItem[] {
  const newInput: OpenAI.Responses.ResponseInputItem[] = [];
  for (const msg of input.filter(
    (m) =>
      m.role === 'user' || m.role === 'assistant' || m.role === 'developer' || m.role === 'system',
  )) {
    if (msg.content === undefined || msg.content === null) {
      continue;
    } else if (typeof msg.content === 'string') {
      newInput.push({
        role: msg.role,
        content: msg.content,
      });
    } else {
      newInput.push({
        role: msg.role,
        content: msg.content
          .filter((part) => part.type === 'text' || part.type === 'image_url')
          .map((part) => {
            if (part.type === 'text') {
              return {
                type: 'input_text',
                text: part.text,
              } as OpenAI.Responses.ResponseInputText;
            } else if (part.type === 'image_url') {
              return {
                type: 'input_image',
                image_url: part.image_url.url,
                detail: 'auto',
              } as OpenAI.Responses.ResponseInputImage;
            }
          })
          .filter((part) => part !== undefined && part !== null),
      });
    }
  }
  return newInput;
}
