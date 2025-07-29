import test, { APIRequestContext, expect } from '@playwright/test';
import { authorizationHeader } from '../../../../../utils/authorizationHeader';

const federalStateRoute = '/api/v1/admin/federal-states';

test('should fetch all federal states with decryptedApiKey', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const response = await request.get(federalStateRoute, {
    headers: { ...authorizationHeader },
  });
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(Array.isArray(json.federalStates)).toBe(true);
  if (json.federalStates.length > 0) {
    expect(json.federalStates[0]).toHaveProperty('decryptedApiKey');
  }
});

test('should return 403 if authorization header is missing', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const response = await request.get(federalStateRoute);
  expect(response.status()).toBe(403);
});
