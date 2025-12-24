import OpenAI from 'openai';
import type { AiModel, TextStreamFn, TextGenerationFn, TokenUsage } from '../types';
import { AiGenerationError, ProviderConfigurationError } from '../../errors';

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

export function constructAzureTextStreamFn(model: AiModel): TextStreamFn {
  const { client, deployment } = createAzureClient(model);

  return async function* getAzureTextStream({ messages, maxTokens }, onComplete) {
    const stream = await client.chat.completions.create({
      model: deployment,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: maxTokens,
    });

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

    return usage;
  };
}

export function constructAzureTextGenerationFn(model: AiModel): TextGenerationFn {
  const { client, deployment } = createAzureClient(model);

  return async function getAzureTextGeneration({ messages, maxTokens }) {
    const response = await client.chat.completions.create(
      {
        model: deployment,
        messages,
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
