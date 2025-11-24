import test, { APIRequestContext, expect } from '@playwright/test';
import { authorizationHeader } from '../../../../../utils/authorizationHeader';
import { DEFAULT_DESIGN_CONFIGURATION } from '@/db/const';
import { cnanoid } from '@telli/shared/random/randomService';
import { FederalStateInsertModel } from '@shared/db/schema';

const federalStateRoute = '/api/v1/admin/federal-states';

test('should create a new federal state with correct default values', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const id = 'Test-' + cnanoid(10);
  const response = await request.post(federalStateRoute, {
    headers: { ...authorizationHeader },
    data: {
      id,
      createdAt: new Date(),
      teacherPriceLimit: 1000,
      studentPriceLimit: 100,
      decryptedApiKey: 'test-api-key',
      featureToggles: {
        isStudentAccessEnabled: false,
        isCharacterEnabled: false,
        isSharedChatEnabled: false,
        isCustomGptEnabled: false,
        isShareTemplateWithSchoolEnabled: false,
      },
    },
  });
  expect(response.ok()).toBeTruthy();
  const responseJson = await response.json();
  expect(responseJson).toMatchObject({
    id,
    chatStorageTime: 120,
    designConfiguration: null,
    mandatoryCertificationTeacher: false,
    studentPriceLimit: 100,
    supportContacts: null,
    teacherPriceLimit: 1000,
    telliName: null,
    trainingLink: null,
  });
});

test('should create a new federal state with all values set', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const id = 'Test-' + cnanoid(10);
  const newFederalState = {
    id,
    teacherPriceLimit: 1000,
    studentPriceLimit: 100,
    decryptedApiKey: 'test-api-key',
    mandatoryCertificationTeacher: true,
    chatStorageTime: 90,
    supportContacts: ['help@support.com'],
    trainingLink: 'https://help.me',
    designConfiguration: DEFAULT_DESIGN_CONFIGURATION,
    telliName: 'myTelliName',
    featureToggles: {
      isStudentAccessEnabled: false,
      isCharacterEnabled: false,
      isSharedChatEnabled: false,
      isCustomGptEnabled: false,
      isShareTemplateWithSchoolEnabled: false,
    },
  };

  const response = await request.post(federalStateRoute, {
    headers: { ...authorizationHeader },
    data: newFederalState,
  });

  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({
    id,
    teacherPriceLimit: 1000,
    studentPriceLimit: 100,
    mandatoryCertificationTeacher: true,
    chatStorageTime: 90,
    supportContacts: ['help@support.com'],
    trainingLink: 'https://help.me',
    designConfiguration: DEFAULT_DESIGN_CONFIGURATION,
    telliName: 'myTelliName',
    featureToggles: {
      isStudentAccessEnabled: false,
      isCharacterEnabled: false,
      isSharedChatEnabled: false,
      isCustomGptEnabled: false,
      isShareTemplateWithSchoolEnabled: false,
    },
  });
});

test('should return 403 because authorization header is missing', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const id = 'Test-' + cnanoid(10);
  const response = await request.post(federalStateRoute, {
    data: {
      id,
      teacherPriceLimit: 1000,
      studentPriceLimit: 100,
      decryptedApiKey: 'test-api-key',
    },
  });
  expect(response.status()).toBe(403);
});

test('should return 409 if federal state with same id already exists', async ({
  request,
}: {
  request: APIRequestContext;
}) => {
  const id = 'Test-' + cnanoid(10);
  const data = {
    id,
    teacherPriceLimit: 1000,
    studentPriceLimit: 100,
    decryptedApiKey: 'test-api-key',
    featureToggles: {
      isStudentAccessEnabled: false,
      isCharacterEnabled: false,
      isSharedChatEnabled: false,
      isCustomGptEnabled: false,
      isShareTemplateWithSchoolEnabled: false,
    },
  };
  // First creation
  await request.post(federalStateRoute, {
    headers: { ...authorizationHeader },
    data,
  });
  // Duplicate creation
  const response = await request.post(federalStateRoute, {
    headers: { ...authorizationHeader },
    data,
  });
  expect(response.status()).toBe(409);
});
