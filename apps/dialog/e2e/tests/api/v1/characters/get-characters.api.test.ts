import test, { expect } from '@playwright/test';
import { db } from '@shared/db';
import { generateUUID } from '@shared/utils/uuid';

const route = '/api/v1/characters';

const userId = generateUUID();
const schoolId = generateUUID();
const modelId = generateUUID();

test.describe('GET /characters', () => {
  test.beforeAll(async () => {
    await db.transaction(async (tx) => {});
  });

  test.afterAll(async () => {
    // Cleanup if necessary
  });

  test('should return 401 if not authenticated', async ({ request }) => {
    const response = await request.get(route);
    expect(response.status()).toBe(401);
  });
});
