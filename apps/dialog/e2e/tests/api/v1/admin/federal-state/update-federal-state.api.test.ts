import test, { APIRequestContext, expect } from '@playwright/test';
import { authorizationHeader } from '../../../../../utils/authorizationHeader';
import { cnanoid } from '@/utils/random';

const federalStateRoute = '/api/v1/admin/federal-states';

test('should update an existing federal state', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const id = 'Test-' + cnanoid(10);
  // Create first
  await request.post(federalStateRoute, {
    headers: { ...authorizationHeader },
    data: {
      id,
      teacherPriceLimit: 1000,
      studentPriceLimit: 100,
      decryptedApiKey: 'test-api-key',
    },
  });
  // Update
  const response = await request.put(federalStateRoute, {
    headers: { ...authorizationHeader },
    data: {
      id,
      supportContact: ['updated-support-contact'],
    },
  });
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json.supportContact).toBe(['updated-support-contact']);
});

test('should return 404 if federal state does not exist', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const id = 'NonExistent-' + cnanoid(10);
  const response = await request.put(federalStateRoute, {
    headers: { ...authorizationHeader },
    data: {
      id,
      teacherPriceLimit: 1000,
      studentPriceLimit: 100,
      decryptedApiKey: 'test-api-key',
    },
  });
  expect(response.status()).toBe(404);
});

test('should return 403 if authorization header is missing', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const id = 'Test-' + cnanoid(10);
  const response = await request.put(federalStateRoute, {
    data: {
      id,
      teacherPriceLimit: 1000,
      studentPriceLimit: 100,
      decryptedApiKey: 'test-api-key',
    },
  });
  expect(response.status()).toBe(403);
});
