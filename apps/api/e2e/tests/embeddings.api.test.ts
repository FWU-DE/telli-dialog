import { test, expect } from '@playwright/test';
import { authorizationHeader } from '../utils/api.js';

test.describe('POST /v1/embeddings', () => {
  test('returns 401 without authentication', async ({ request }) => {
    const response = await request.post('/v1/embeddings', {
      data: {
        model: 'text-embedding-ada-002',
        input: ['Hello world'],
      },
    });

    expect(response.status()).toBe(401);
  });

  test('returns 400 for invalid request body', async ({ request }) => {
    const response = await request.post('/v1/embeddings', {
      headers: authorizationHeader,
      data: { invalid: 'body' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns embedding vectors', async ({ request }) => {
    // Get available models to find an embedding model
    const modelsResponse = await request.get('/v1/models', {
      headers: authorizationHeader,
    });
    const models = await modelsResponse.json();
    const embeddingModel = models.find(
      (m: { name: string }) => m.name.includes('embedding') || m.name.includes('bge'),
    );
    expect(embeddingModel).toBeDefined();

    const response = await request.post('/v1/embeddings', {
      headers: authorizationHeader,
      data: {
        model: embeddingModel.name,
        input: ['The quick brown fox jumps over the lazy dog'],
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    // Each embedding should have a vector
    const embedding = body.data[0];
    expect(embedding).toHaveProperty('embedding');
    expect(Array.isArray(embedding.embedding)).toBe(true);
    expect(embedding.embedding.length).toBeGreaterThan(0);

    // Usage should be tracked
    expect(body).toHaveProperty('usage');
    expect(body.usage).toHaveProperty('prompt_tokens');
    expect(body.usage).toHaveProperty('total_tokens');
  });
});
