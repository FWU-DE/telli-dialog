import assert from 'node:assert';
import buildApp from '@/app';
import { afterAll, afterEach, beforeAll, beforeEach, test, describe } from 'vitest';
import { FastifyInstance } from 'fastify';
import {
  dbCreateOrganization,
  dbDeleteOrganizationById,
  dbCreateProject,
  dbCreateJustTheApiKey,
  dbDeleteApiKey,
} from '@telli/api-database';
import { env } from '@/env';
import { API_KEY_ID } from '@test/testData';

// Use unique IDs to avoid conflicts with other tests - exact same pattern as working tests
const TEST_ORGANIZATION_ID = '5dbd7831-fcd2-4db3-aa93-6142893c51c3';
const TEST_PROJECT_ID = '5dbd7831-fcd2-4db3-aa93-6142893c51c4';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();

  const testOrganization = {
    id: TEST_ORGANIZATION_ID,
    name: 'Test Organization for API Key Patch',
  };
  await dbCreateOrganization(testOrganization);

  await dbCreateProject({
    id: TEST_PROJECT_ID,
    organizationId: TEST_ORGANIZATION_ID,
    name: 'Test Project for API Key Patch',
  });
});

afterAll(async () => {
  await dbDeleteOrganizationById(TEST_ORGANIZATION_ID);
  await app.close();
});

beforeEach(async () => {
  await dbCreateJustTheApiKey({
    id: API_KEY_ID,
    name: 'Test API Key',
    projectId: TEST_PROJECT_ID,
    state: 'active',
    limitInCent: 1000,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });
});

afterEach(async () => {
  await dbDeleteApiKey(API_KEY_ID);
});

describe('PATCH API Key', () => {
  test('should update multiple API key fields and return 200', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/v1/admin/organizations/${TEST_ORGANIZATION_ID}/projects/${TEST_PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: 'Bearer ' + env.apiKey },
      payload: {
        name: 'Updated API Key Name',
        state: 'inactive',
        limitInCent: 2500,
      },
    });

    assert.strictEqual(response.statusCode, 200);

    const body = response.json();
    assert.strictEqual(body.name, 'Updated API Key Name');
    assert.strictEqual(body.state, 'inactive');
    assert.strictEqual(body.limitInCent, 2500);
    assert.strictEqual(body.id, API_KEY_ID);
    assert.strictEqual(body.projectId, TEST_PROJECT_ID);

    // Verify sensitive fields are not returned
    assert.strictEqual(body.keyId, undefined);
    assert.strictEqual(body.secretHash, undefined);
  });
});
