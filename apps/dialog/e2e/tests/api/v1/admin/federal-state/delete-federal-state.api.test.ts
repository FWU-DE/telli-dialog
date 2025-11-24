import test, { APIRequestContext, expect } from '@playwright/test';
import { authorizationHeader } from '../../../../../utils/authorizationHeader';
import { cnanoid } from '@telli/shared/random/randomService';

const federalStateRoute = '/api/v1/admin/federal-states';

test('should delete an existing federal state', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const id = 'Delete-' + cnanoid(10);
  // Create first
  await request.post(federalStateRoute, {
    headers: { ...authorizationHeader },
    data: {
      id,
      teacherPriceLimit: 1000,
      studentPriceLimit: 100,
      decryptedApiKey: 'delete-api-key',
      featureToggles: {
        isStudentAccessEnabled: false,
        isCharacterEnabled: false,
        isSharedChatEnabled: false,
        isCustomGptEnabled: false,
        isShareTemplateWithSchoolEnabled: false,
      },
    },
  });
  // Delete
  const response = await request.delete(federalStateRoute, {
    headers: { ...authorizationHeader },
    data: { id },
  });
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json.id).toBe(id);
});

test('should return 404 if federal state does not exist', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const id = 'NonExistent-' + cnanoid(10);
  const response = await request.delete(federalStateRoute, {
    headers: { ...authorizationHeader },
    data: { id },
  });
  expect(response.status()).toBe(404);
});

test('should return 403 if authorization header is missing', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const id = 'Delete-' + cnanoid(10);
  const response = await request.delete(federalStateRoute, {
    data: { id },
  });
  expect(response.status()).toBe(403);
});

test('should return 400 if id is missing', async ({ request }: { request: APIRequestContext }) => {
  const response = await request.delete(federalStateRoute, {
    headers: { ...authorizationHeader },
    data: {},
  });
  expect(response.status()).toBe(400);
});
