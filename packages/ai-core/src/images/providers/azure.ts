import OpenAI from 'openai';
import type { AiModel, ImageGenerationFn } from '../types';
import { ImageGenerationError, ProviderConfigurationError } from '../errors';

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

export function constructAzureImageGenerationFn(model: AiModel): ImageGenerationFn {
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

    if (!result.data || result.data.length === 0) {
      throw new ImageGenerationError('No image data received from Azure OpenAI');
    }

    return {
      data: result.data
        .map((item) => item.b64_json)
        .filter((item): item is string => item !== undefined),
      output_format: 'png',
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
