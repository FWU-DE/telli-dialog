import OpenAI from 'openai';
import type { AiModel, TextStreamFn, TextGenerationFn, TokenUsage } from '../types';
import { AiGenerationError, ProviderConfigurationError } from '../../errors';
import { toOpenAIMessages, toOpenAIResponsesInput } from '../utils';

function createAzureClient(model: AiModel): {
  client: OpenAI;
  deployment: string;
} {
  if (model.setting.provider !== 'azure') {
    throw new ProviderConfigurationError('Invalid model configuration for Azure');
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

export function constructAzureChatCompletionStreamFn(model: AiModel): TextStreamFn {
  const { client, deployment } = createAzureClient(model);

  return async function* getAzureTextStream({ messages, maxTokens }, onComplete) {
    // For Azure, we use the deployment from the URL, not the model name
    const stream = await client.chat.completions.create(
      {
        model: deployment,
        messages: toOpenAIMessages(messages),
        stream: true,
        stream_options: { include_usage: true },
        max_tokens: maxTokens,
      },
      {
        path: `/openai/deployments/${deployment}/chat/completions`,
      },
    );

    let usage: TokenUsage | undefined;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;

      if (content) {
        yield content;
      }

      if (chunk.usage) {
        usage = {
          completionTokens: chunk.usage.completion_tokens,
          promptTokens: chunk.usage.prompt_tokens,
          totalTokens: chunk.usage.total_tokens,
        };
      }
    }

    if (!usage) {
      throw new AiGenerationError('No usage data returned from Azure OpenAI stream');
    }

    // Call the callback if provided
    if (onComplete) {
      await onComplete(usage);
    }
  };
}

/**
 * Alternative streaming function using the OpenAI Responses API
 * The Responses API provides a more flexible interface with built-in tool support
 */
export function constructAzureResponsesStreamFn(model: AiModel): TextStreamFn {
  const { client, deployment } = createAzureClient(model);

  return async function* getAzureTextStream({ messages, maxTokens }, onComplete) {
    const response = await client.responses.create(
      {
        model: deployment,
        input: toOpenAIResponsesInput(messages),
        stream: true,
        max_output_tokens: maxTokens,
        ...model.additionalParameters,
      },
      {
        path: `/openai/responses`,
      },
    );

    let usage: TokenUsage | undefined;

    for await (const event of response) {
      if (event.type === 'response.output_text.delta') {
        yield event.delta;
      }

      if (event.type === 'response.completed' && event.response.usage) {
        usage = {
          completionTokens: event.response.usage.output_tokens,
          promptTokens: event.response.usage.input_tokens,
          totalTokens: event.response.usage.total_tokens,
        };
      }
    }

    if (!usage) {
      throw new AiGenerationError('No usage data returned from Azure OpenAI Responses API stream');
    }

    if (onComplete) {
      await onComplete(usage);
    }
  };
}

export function constructAzureChatCompletionGenerationFn(model: AiModel): TextGenerationFn {
  const { client, deployment } = createAzureClient(model);

  return async function getAzureTextGeneration({ messages, maxTokens }) {
    // For Azure, we use the deployment from the URL, not the model name
    const response = await client.chat.completions.create(
      {
        model: deployment,
        messages: toOpenAIMessages(messages),
        stream: false,
        max_completion_tokens: maxTokens,
      },
      {
        path: `/openai/deployments/${deployment}/chat/completions`,
      },
    );

    const text = response.choices[0]?.message?.content ?? '';
    const usage = response.usage;

    if (!usage) {
      throw new AiGenerationError('No usage data returned from Azure OpenAI');
    }

    return {
      text,
      usage: {
        completionTokens: usage.completion_tokens,
        promptTokens: usage.prompt_tokens,
        totalTokens: usage.total_tokens,
      },
    };
  };
}
/**
 * Alternative non-streaming function using the OpenAI Responses API
 */
export function constructAzureResponsesGenerationFn(model: AiModel): TextGenerationFn {
  const { client, deployment } = createAzureClient(model);

  return async function getAzureTextGeneration({ messages, maxTokens }) {
    const response = await client.responses.create(
      {
        model: deployment,
        input: toOpenAIResponsesInput(messages),
        stream: false,
        max_output_tokens: maxTokens,
      },
      {
        path: `/openai/responses`,
      },
    );

    // Extract text from output items
    const textOutput = response.output.find((item) => item.type === 'message');
    const text =
      textOutput?.type === 'message'
        ? textOutput.content
            .filter((c) => c.type === 'output_text')
            .map((c) => (c.type === 'output_text' ? c.text : ''))
            .join('')
        : '';

    const usage = response.usage;

    if (!usage) {
      throw new AiGenerationError('No usage data returned from Azure OpenAI Responses API');
    }

    return {
      text,
      usage: {
        completionTokens: usage.output_tokens,
        promptTokens: usage.input_tokens,
        totalTokens: usage.total_tokens,
      },
    };
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
    throw new ProviderConfigurationError('Invalid Azure baseUrl format.');
  }

  const searchParams = new URLSearchParams(queryString.join('?'));

  const urlParts = urlWithoutQuery.split('/');
  const deploymentIndex = urlParts.findIndex((part) => part === 'deployments');

  if (deploymentIndex === -1 || deploymentIndex >= urlParts.length - 1) {
    throw new ProviderConfigurationError(
      'Invalid Azure baseUrl format. Expected format: https://{endpoint}.openai.azure.com/openai/deployments/{deployment-id}',
    );
  }

  const deployment = urlParts[deploymentIndex + 1];
  if (deployment === undefined) {
    throw new ProviderConfigurationError(
      'Invalid Azure baseUrl format. Expected format: https://{endpoint}.openai.azure.com/openai/deployments/{deployment-id}',
    );
  }
  const basePath = urlParts.slice(0, deploymentIndex - 1).join('/');

  return { basePath, deployment, searchParams };
}
