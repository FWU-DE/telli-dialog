import test, { APIRequestContext, expect } from '@playwright/test';
import { authorizationHeader } from '../../../../../utils/authorizationHeader';
import { cnanoid } from '@/utils/random';

const customGptTemplateRoute = '/api/v1/admin/templates/custom-gpt';

test.describe('Custom GPT Template API', () => {
  test('GET - should fetch all global custom GPT templates', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    // First create a custom GPT template to ensure there's at least one in the list
    const testCustomGptName = 'GET Test Custom GPT ' + cnanoid(8);
    const customGptData = [
      {
        name: testCustomGptName,
        description: 'Test custom GPT for GET request verification',
        specification: 'Test specification for custom GPT behavior',
      },
    ];

    const createResponse = await request.post(customGptTemplateRoute, {
      headers: { ...authorizationHeader },
      data: customGptData,
    });

    expect(createResponse.ok()).toBeTruthy();
    const createResult = await createResponse.json();
    const createdCustomGptId = createResult.results[0].data.id;

    // Now fetch all custom GPT templates
    const response = await request.get(customGptTemplateRoute, {
      headers: { ...authorizationHeader },
    });

    expect(response.ok()).toBeTruthy();
    const customGpts = await response.json();
    expect(Array.isArray(customGpts)).toBeTruthy();
    expect(customGpts.length).toBeGreaterThan(0);

    // Verify our created custom GPT is in the list
    const createdCustomGpt = customGpts.find((gpt: any) => gpt.id === createdCustomGptId);
    expect(createdCustomGpt).toBeDefined();
    expect(createdCustomGpt).toMatchObject({
      id: createdCustomGptId,
      name: testCustomGptName,
      description: 'Test custom GPT for GET request verification',
      specification: 'Test specification for custom GPT behavior',
      accessLevel: 'global',
    });

    // Verify the general structure of custom GPTs in the list
    expect(createdCustomGpt).toHaveProperty('id');
    expect(createdCustomGpt).toHaveProperty('name');
    expect(createdCustomGpt).toHaveProperty('description');
    expect(createdCustomGpt).toHaveProperty('accessLevel', 'global');
  });

  test('GET - should return 403 when authorization header is missing', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const response = await request.get(customGptTemplateRoute);
    expect(response.status()).toBe(403);
  });

  test('POST - should create a single custom GPT template with minimal required fields', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const customGptName = 'Test Custom GPT ' + cnanoid(8);
    const customGptData = [
      {
        name: customGptName,
        description: 'Test custom GPT description',
        specification: 'Test specification for custom GPT behavior',
      },
    ];

    const response = await request.post(customGptTemplateRoute, {
      headers: { ...authorizationHeader },
      data: customGptData,
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result).toHaveProperty('results');
    expect(Array.isArray(result.results)).toBeTruthy();
    expect(result.results[0]).toHaveProperty('data');
    expect(result.results[0].data).toMatchObject({
      name: customGptName,
      description: 'Test custom GPT description',
      specification: 'Test specification for custom GPT behavior',
      accessLevel: 'global',
    });
  });

  test('POST - should create a custom GPT template with all optional fields', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const customGptName = 'Full Test Custom GPT ' + cnanoid(8);
    const customGptData = [
      {
        name: customGptName,
        description: 'Full test custom GPT description',
        specification: 'Comprehensive specification for advanced custom GPT behavior',
        promptSuggestions: [
          'Help me understand complex topics',
          'Explain this concept step by step',
          'What are the key points about this subject?',
        ],
        pictureId: 'test-picture-id',
      },
    ];

    const response = await request.post(customGptTemplateRoute, {
      headers: { ...authorizationHeader },
      data: customGptData,
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.results[0].data).toMatchObject({
      name: customGptName,
      description: 'Full test custom GPT description',
      specification: 'Comprehensive specification for advanced custom GPT behavior',
      promptSuggestions: [
        'Help me understand complex topics',
        'Explain this concept step by step',
        'What are the key points about this subject?',
      ],
      pictureId: 'test-picture-id',
      accessLevel: 'global',
    });
  });

  test('POST - should create multiple custom GPT templates in a single request', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const customGptData = [
      {
        name: 'Math Tutor GPT ' + cnanoid(8),
        description: 'Mathematics tutoring assistant',
        specification: 'Specialized in providing step-by-step math solutions and explanations',
        promptSuggestions: ['Solve this equation', 'Explain this theorem'],
      },
      {
        name: 'Writing Coach GPT ' + cnanoid(8),
        description: 'Writing improvement assistant',
        specification: 'Helps with grammar, style, and structure of written content',
        promptSuggestions: ['Review my essay', 'Improve this paragraph'],
      },
    ];

    const response = await request.post(customGptTemplateRoute, {
      headers: { ...authorizationHeader },
      data: customGptData,
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toHaveProperty('data');
    expect(result.results[1]).toHaveProperty('data');
    expect(result.results[0].data?.name).toBe(customGptData[0]?.name);
    expect(result.results[1].data?.name).toBe(customGptData[1]?.name);
  });

  test('POST - should handle duplicate custom GPT names gracefully', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const duplicateName = 'Duplicate Custom GPT ' + cnanoid(8);

    // First create a custom GPT
    const firstCustomGptData = [
      {
        name: duplicateName,
        description: 'First custom GPT',
        specification: 'First specification',
        promptSuggestions: ['First prompt'],
      },
    ];

    const firstResponse = await request.post(customGptTemplateRoute, {
      headers: { ...authorizationHeader },
      data: firstCustomGptData,
    });

    expect(firstResponse.ok()).toBeTruthy();

    // Then try to create another with the same name
    const secondCustomGptData = [
      {
        name: duplicateName,
        description: 'Second custom GPT',
        specification: 'Second specification',
        promptSuggestions: ['Second prompt', 'Another prompt'],
      },
    ];
    const secondResponse = await request.post(customGptTemplateRoute, {
      headers: { ...authorizationHeader },
      data: secondCustomGptData,
    });

    expect(secondResponse.ok()).toBeTruthy();
    const result = await secondResponse.json();

    // Verify the custom GPT was updated (upserted) with new data
    expect(result.results[0]).toHaveProperty('data');
    expect(result.results[0].data.name).toBe(duplicateName);
    expect(result.results[0].data.description).toBe('Second custom GPT');
    expect(result.results[0].data.specification).toBe('Second specification');
    expect(result.results[0].data.promptSuggestions).toEqual(['Second prompt', 'Another prompt']);
  });

  test('POST - should return 403 when authorization header is missing', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const customGptData = [
      {
        name: 'Test Custom GPT',
        description: 'Test description',
        specification: 'Test specification',
      },
    ];

    const response = await request.post(customGptTemplateRoute, {
      data: customGptData,
    });

    expect(response.status()).toBe(403);
  });

  test('POST - should return 400 for invalid JSON format', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const response = await request.post(customGptTemplateRoute, {
      headers: {
        ...authorizationHeader,
        'Content-Type': 'application/json',
      },
      data: 'invalid json',
    });

    expect(response.status()).toBe(400);
  });

  test('POST - should return 400 for non-array input', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const singleCustomGptData = {
      name: 'Single Custom GPT',
      description: 'Single description',
      specification: 'Single specification',
    };

    const response = await request.post(customGptTemplateRoute, {
      headers: { ...authorizationHeader },
      data: singleCustomGptData, // Should be an array
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result).toHaveProperty('error', 'Validation failed');
  });

  test('POST - should return 400 for missing required fields', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const incompleteCustomGptData = [
      {
        name: 'Incomplete Custom GPT',
        description: 'Missing specification field',
        // specification field is missing
      },
    ];

    const response = await request.post(customGptTemplateRoute, {
      headers: { ...authorizationHeader },
      data: incompleteCustomGptData,
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result).toHaveProperty('error', 'Validation failed');
    expect(result).toHaveProperty('details');
    expect(Array.isArray(result.details)).toBeTruthy();
  });

  test('POST - should handle empty promptSuggestions array', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const customGptName = 'Empty Prompts GPT ' + cnanoid(8);
    const customGptData = [
      {
        name: customGptName,
        description: 'Custom GPT with empty prompt suggestions',
        specification: 'Test specification',
        promptSuggestions: [],
      },
    ];

    const response = await request.post(customGptTemplateRoute, {
      headers: { ...authorizationHeader },
      data: customGptData,
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.results[0].data).toMatchObject({
      name: customGptName,
      description: 'Custom GPT with empty prompt suggestions',
      specification: 'Test specification',
      promptSuggestions: [],
      accessLevel: 'global',
    });
  });
});
