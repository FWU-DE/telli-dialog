import test, { APIRequestContext, expect } from '@playwright/test';
import { authorizationHeader } from '../../../../../utils/authorizationHeader';
import { cnanoid } from '@/utils/random';

const characterTemplateRoute = '/api/v1/admin/templates/character';

test.describe('Character Template API', () => {
  test('GET - should fetch all global character templates', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    // First create a character template to ensure there's at least one in the list
    const testCharacterName = 'GET Test Character ' + cnanoid(8);
    const characterData = [
      {
        name: testCharacterName,
        description: 'Test character for GET request verification',
        learningContext: 'Test learning context',
        competence: 'Test competence',
      },
    ];

    const createResponse = await request.post(characterTemplateRoute, {
      headers: { ...authorizationHeader },
      data: characterData,
    });

    expect(createResponse.ok(), `Response code is ${createResponse.status()}`).toBeTruthy();
    const createResult = await createResponse.json();
    const createdCharacterId = createResult.results[0].data.id;

    // Now fetch all character templates
    const response = await request.get(characterTemplateRoute, {
      headers: { ...authorizationHeader },
    });

    expect(response.ok()).toBeTruthy();
    const characters = await response.json();
    expect(Array.isArray(characters)).toBeTruthy();
    expect(characters.length).toBeGreaterThan(0);

    // Verify our created character is in the list
    const createdCharacter = characters.find((char: any) => char.id === createdCharacterId);
    expect(createdCharacter).toBeDefined();
    expect(createdCharacter).toMatchObject({
      id: createdCharacterId,
      name: testCharacterName,
      description: 'Test character for GET request verification',
      learningContext: 'Test learning context',
      competence: 'Test competence',
      accessLevel: 'global',
    });

    // Verify the general structure of characters in the list
    expect(createdCharacter).toHaveProperty('id');
    expect(createdCharacter).toHaveProperty('name');
    expect(createdCharacter).toHaveProperty('description');
    expect(createdCharacter).toHaveProperty('accessLevel', 'global');
  });

  test('GET - should return 403 when authorization header is missing', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const response = await request.get(characterTemplateRoute);
    expect(response.status()).toBe(403);
  });

  test('POST - should create a single character template with minimal required fields', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const characterName = 'Test Character ' + cnanoid(8);
    const characterData = [
      {
        name: characterName,
        description: 'Test character description',
        learningContext: 'Test learning context',
        competence: 'Test competence',
      },
    ];

    const response = await request.post(characterTemplateRoute, {
      headers: { ...authorizationHeader },
      data: characterData,
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result).toHaveProperty('results');
    expect(Array.isArray(result.results)).toBeTruthy();
    expect(result.results[0]).toHaveProperty('data');
    expect(result.results[0].data).toMatchObject({
      name: characterName,
      description: 'Test character description',
      learningContext: 'Test learning context',
      competence: 'Test competence',
      accessLevel: 'global',
    });
  });

  test('POST - should create a character template with all optional fields', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const characterName = 'Full Test Character ' + cnanoid(8);
    const characterData = [
      {
        name: characterName,
        description: 'Full test character description',
        learningContext: 'Advanced learning context',
        competence: 'Expert level competence',
        schoolType: 'Gymnasium',
        gradeLevel: '10-12',
        subject: 'Mathematics',
        specifications: 'Specialized in algebra and geometry',
        restrictions: 'No access to external calculators',
        pictureId: 'test-picture-id',
      },
    ];

    const response = await request.post(characterTemplateRoute, {
      headers: { ...authorizationHeader },
      data: characterData,
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.results[0].data).toMatchObject({
      name: characterName,
      description: 'Full test character description',
      learningContext: 'Advanced learning context',
      competence: 'Expert level competence',
      schoolType: 'Gymnasium',
      gradeLevel: '10-12',
      subject: 'Mathematics',
      specifications: 'Specialized in algebra and geometry',
      restrictions: 'No access to external calculators',
      pictureId: 'test-picture-id',
      accessLevel: 'global',
    });
  });

  test('POST - should create multiple character templates in a single request', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const characterData = [
      {
        name: 'Math Teacher ' + cnanoid(8),
        description: 'Mathematics teacher assistant',
        learningContext: 'High school mathematics',
        competence: 'Advanced mathematics knowledge',
        subject: 'Mathematics',
      },
      {
        name: 'Science Guide ' + cnanoid(8),
        description: 'Science learning guide',
        learningContext: 'General science education',
        competence: 'Broad science knowledge',
        subject: 'Science',
      },
    ];

    const response = await request.post(characterTemplateRoute, {
      headers: { ...authorizationHeader },
      data: characterData,
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toHaveProperty('data');
    expect(result.results[1]).toHaveProperty('data');
    expect(result.results[0].data?.name).toBe(characterData[0]?.name);
    expect(result.results[1].data?.name).toBe(characterData[1]?.name);
  });

  test('POST - should handle duplicate character names gracefully', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const duplicateName = 'Duplicate Character ' + cnanoid(8);

    // First create a character
    const firstCharacterData = [
      {
        name: duplicateName,
        description: 'First character',
        learningContext: 'First context',
        competence: 'First competence',
      },
    ];

    const firstResponse = await request.post(characterTemplateRoute, {
      headers: { ...authorizationHeader },
      data: firstCharacterData,
    });

    expect(firstResponse.ok()).toBeTruthy();

    // Then try to create another with the same name
    const secondCharacterData = [
      {
        name: duplicateName,
        description: 'Second character',
        learningContext: 'Second context',
        competence: 'Second competence',
      },
    ];
    const secondResponse = await request.post(characterTemplateRoute, {
      headers: { ...authorizationHeader },
      data: secondCharacterData,
    });

    expect(secondResponse.ok()).toBeTruthy();
    const result = await secondResponse.json();

    // Verify the character was updated (upserted) with new data
    expect(result.results[0]).toHaveProperty('data');
    expect(result.results[0].data.name).toBe(duplicateName);
    expect(result.results[0].data.description).toBe('Second character');
    expect(result.results[0].data.learningContext).toBe('Second context');
    expect(result.results[0].data.competence).toBe('Second competence');
  });

  test('POST - should return 403 when authorization header is missing', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const characterData = [
      {
        name: 'Test Character',
        description: 'Test description',
        learningContext: 'Test context',
        competence: 'Test competence',
      },
    ];

    const response = await request.post(characterTemplateRoute, {
      data: characterData,
    });

    expect(response.status()).toBe(403);
  });

  test('POST - should return 400 for invalid JSON format', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const response = await request.post(characterTemplateRoute, {
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
    const singleCharacterData = {
      name: 'Single Character',
      description: 'Single description',
      learningContext: 'Single context',
      competence: 'Single competence',
    };

    const response = await request.post(characterTemplateRoute, {
      headers: { ...authorizationHeader },
      data: singleCharacterData, // Should be an array
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result).toHaveProperty('error', 'Validation failed');
  });
});
