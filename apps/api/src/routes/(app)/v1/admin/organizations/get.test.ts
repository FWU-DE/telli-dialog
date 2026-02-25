import assert from 'node:assert';
import buildApp from '@/app';
import { afterAll, afterEach, beforeAll, beforeEach, describe, test } from 'vitest';
import { FastifyInstance } from 'fastify';
import { dbCreateOrganization, dbDeleteOrganizationById } from '@telli/api-database';
import { env } from '@/env';

const TEST_ORGANIZATION_1_ID = '42804694-e1f6-45d7-aaaa-0e08c746a888';
const TEST_ORGANIZATION_2_ID = '52804694-e1f6-45d7-aaaa-0e08c746a999';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();

  // Setup test organizations
  await dbCreateOrganization({
    id: TEST_ORGANIZATION_1_ID,
    name: 'Test Organization 1',
  });

  await dbCreateOrganization({
    id: TEST_ORGANIZATION_2_ID,
    name: 'Test Organization 2',
  });
});

afterAll(async () => {
  // Clean up test organizations
  await dbDeleteOrganizationById(TEST_ORGANIZATION_1_ID);
  await dbDeleteOrganizationById(TEST_ORGANIZATION_2_ID);

  await app.close();
});

beforeEach(async () => {});

afterEach(async () => {});

describe('GET /v1/admin/organizations', () => {
  test('should return 200 and list of organizations', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/admin/organizations',
      headers: { authorization: 'Bearer ' + env.apiKey },
    });

    assert.strictEqual(response.statusCode, 200);

    const responseBody = response.json();
    assert.ok(responseBody);
    assert.ok(Array.isArray(responseBody));

    // Should contain our test organizations
    const orgNames = responseBody.map((org) => org.name);
    assert.ok(orgNames.includes('Test Organization 1'));
    assert.ok(orgNames.includes('Test Organization 2'));

    // Check that the first organization has the correct structure
    const sampleOrg = responseBody[0];
    assert.ok(typeof sampleOrg.id === 'string');
    assert.ok(typeof sampleOrg.name === 'string');
    assert.ok(sampleOrg.createdAt);
  });
});
