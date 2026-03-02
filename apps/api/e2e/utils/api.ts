import type { APIRequestContext } from '@playwright/test';

const API_KEY =
  process.env.DE_TEST_API_KEY ?? process.env.E2E_CLIENT_API_KEY ?? process.env.API_KEY;

if (!API_KEY) {
  throw new Error(
    'An API key environment variable is required. Set DE_TEST_API_KEY, E2E_CLIENT_API_KEY, or API_KEY in apps/api/.env.test',
  );
}

export const authorizationHeader = {
  Authorization: `Bearer ${API_KEY}`,
};

export const baseURL = process.env.API_BASE_URL ?? 'http://localhost:3002';

type ApiModel = {
  name: string;
  isDeleted?: boolean;
  priceMetadata?: {
    type?: string;
  };
};

/**
 * Fetches available models from the API and returns the first model matching
 * the given predicate. Throws if no matching model is found.
 */
async function findModel(
  request: APIRequestContext,
  predicate: (model: ApiModel) => boolean,
  errorMessage: string,
): Promise<ApiModel> {
  const modelsResponse = await request.get('/v1/models', {
    headers: authorizationHeader,
  });
  const modelsPayload = (await modelsResponse.json()) as unknown;

  if (!modelsResponse.ok() || !Array.isArray(modelsPayload)) {
    throw new Error(
      `Failed to load models (${modelsResponse.status()}): ${JSON.stringify(modelsPayload)}`,
    );
  }

  const models = modelsPayload as Array<ApiModel>;
  const model = models.find(predicate);
  if (!model) {
    throw new Error(errorMessage);
  }
  return model;
}

/** Returns a text/chat model (e.g. gpt-4o-mini, llama, gpt). Throws if none available. */
export async function getTextModel(request: APIRequestContext) {
  return findModel(
    request,
    (m) => {
      if (m.isDeleted) return false;
      const modelName = m.name.toLowerCase();
      return (
        modelName === 'gpt-4o-mini' || modelName.includes('llama') || modelName.includes('gpt')
      );
    },
    'No text model available',
  );
}

/** Returns an embedding model (e.g. text-embedding-*, bge-*). Throws if none available. */
export async function getEmbeddingModel(request: APIRequestContext) {
  return findModel(
    request,
    (m) => {
      if (m.isDeleted) return false;
      return (
        m.priceMetadata?.type === 'embedding' ||
        m.name.toLowerCase().includes('embedding') ||
        m.name.toLowerCase().includes('bge')
      );
    },
    'No embedding model available',
  );
}

/** Returns an image generation model. Throws if none available. */
export async function getImageModel(request: APIRequestContext) {
  return findModel(
    request,
    (m) => !m.isDeleted && m.priceMetadata?.type === 'image',
    'No image generation model available',
  );
}
