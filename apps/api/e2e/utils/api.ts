import type { APIRequestContext } from '@playwright/test';

const API_KEY = process.env.DE_TEST_API_KEY ?? process.env.E2E_CLIENT_API_KEY ?? process.env.API_KEY;

if (!API_KEY) {
  throw new Error(
    'An API key environment variable is required. Set DE_TEST_API_KEY, E2E_CLIENT_API_KEY, or API_KEY in apps/api/.env.test',
  );
}

export const authorizationHeader = {
  Authorization: `Bearer ${API_KEY}`,
};

export const baseURL = process.env.API_BASE_URL ?? 'http://localhost:3002';

/**
 * Fetches available models from the API and returns the first model matching
 * the given predicate. Throws if no matching model is found.
 */
async function findModel(
  request: APIRequestContext,
  predicate: (model: { name: string }) => boolean,
  errorMessage: string,
): Promise<{ name: string }> {
  const modelsResponse = await request.get('/v1/models', {
    headers: authorizationHeader,
  });
  const modelsPayload = await modelsResponse.json();

  if (!modelsResponse.ok() || !Array.isArray(modelsPayload)) {
    throw new Error(
      `Failed to load models (${modelsResponse.status()}): ${JSON.stringify(modelsPayload)}`,
    );
  }

  const models = modelsPayload as Array<{ name: string }>;
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
    (m) => m.name === 'gpt-4o-mini' || m.name.includes('llama') || m.name.includes('gpt'),
    'No text model available',
  );
}

/** Returns an embedding model (e.g. text-embedding-*, bge-*). Throws if none available. */
export async function getEmbeddingModel(request: APIRequestContext) {
  return findModel(
    request,
    (m) => m.name.includes('embedding') || m.name.includes('bge'),
    'No embedding model available',
  );
}

/** Returns an image generation model (e.g. dall-e-*, imagen-*). Throws if none available. */
export async function getImageModel(request: APIRequestContext) {
  return findModel(
    request,
    (m) => m.name.includes('dall-e') || m.name.includes('imagen'),
    'No image generation model available',
  );
}
