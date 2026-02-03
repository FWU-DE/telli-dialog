import test, { expect } from '@playwright/test';
import { authorizationHeader } from '../../../../../utils/authorizationHeader';
import { db } from '@shared/db';
import {
  CharacterFileMapping,
  characterTable,
  CustomGptFileMapping,
  customGptTable,
  fileTable,
  llmModelTable,
  LearningScenarioFileMapping,
  LearningScenarioInsertModel,
  learningScenarioTable,
  userTable,
} from '@shared/db/schema';
import { eq } from 'drizzle-orm';
import { generateUUID } from '@shared/utils/uuid';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

const cleanupRoute = '/api/v1/admin/cleanup';

test.describe('cleanup', () => {
  let userId = '';
  let modelId = '';

  test.beforeEach(async () => {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(userTable)
        .values({ firstName: '', lastName: '', email: generateUUID() })
        .returning();
      if (!user) {
        throw Error('Failed to create user');
      }
      userId = user.id;

      const [model] = await tx.select().from(llmModelTable).limit(1);
      if (!model) {
        throw Error('Failed to find model');
      }
      modelId = model.id;
    });
  });

  test.afterEach(async () => {
    await db.transaction(async (tx) => {
      await tx
        .delete(learningScenarioTable)
        .where(eq(learningScenarioTable.userId, userId));
      await tx.delete(characterTable).where(eq(characterTable.userId, userId));
      await tx.delete(customGptTable).where(eq(customGptTable.userId, userId));
      await tx.delete(userTable).where(eq(userTable.id, userId));
    });
  });

  test('should delete learning scenarios', async ({ request }) => {
    const oldLearningScenario = await createLearningScenario({
      userId,
      modelId,
      createdAt: new Date(2025, 0, 1),
    });
    const newLearningScenario = await createLearningScenario({
      userId,
      modelId,
      createdAt: new Date(),
    });

    // Delete
    const response = await request.delete(cleanupRoute, { headers: authorizationHeader });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.deletedLearningScenarios).toBeGreaterThanOrEqual(1);

    const resultDeleted = await db
      .select()
      .from(learningScenarioTable)
      .where(eq(learningScenarioTable.id, oldLearningScenario.id));
    expect(resultDeleted).toHaveLength(0);

    const resultExisting = await db
      .select()
      .from(learningScenarioTable)
      .where(eq(learningScenarioTable.id, newLearningScenario.id));
    expect(resultExisting).toHaveLength(1);
  });

  test('should delete characters', async ({ request }) => {
    const oldCharacter = await createCharacter({
      userId,
      modelId,
      createdAt: new Date(2025, 0, 1),
    });
    const newCharacter = await createCharacter({
      userId,
      modelId,
      createdAt: new Date(),
    });

    // Delete
    const response = await request.delete(cleanupRoute, { headers: authorizationHeader });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.deletedCharacters).toBeGreaterThanOrEqual(1);

    const resultDeleted = await db
      .select()
      .from(characterTable)
      .where(eq(characterTable.id, oldCharacter.id));
    expect(resultDeleted).toHaveLength(0);

    const resultExisting = await db
      .select()
      .from(characterTable)
      .where(eq(characterTable.id, newCharacter.id));
    expect(resultExisting).toHaveLength(1);
  });

  test('should delete custom GPTs', async ({ request }) => {
    const oldCustomGpt = await createCustomGpt({
      userId,
      createdAt: new Date(2025, 0, 1),
    });
    const newCustomGpt = await createCustomGpt({
      userId,
      createdAt: new Date(),
    });

    // Delete
    const response = await request.delete(cleanupRoute, { headers: authorizationHeader });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.deletedCustomGpts).toBeGreaterThanOrEqual(1);

    const resultDeleted = await db
      .select()
      .from(customGptTable)
      .where(eq(customGptTable.id, oldCustomGpt.id));
    expect(resultDeleted).toHaveLength(0);

    const resultExisting = await db
      .select()
      .from(customGptTable)
      .where(eq(customGptTable.id, newCustomGpt.id));
    expect(resultExisting).toHaveLength(1);
  });
});

test('should return 403 if authorization header is missing', async ({ request }) => {
  const response = await request.delete(cleanupRoute);
  expect(response.status()).toBe(403);
});

async function createLearningScenario(
  data?: Partial<LearningScenarioInsertModel> & { createdAt?: Date },
) {
  const [learningScenario] = await db
    .insert(learningScenarioTable)
    .values({
      name: '',
      userId: generateUUID(),
      modelId: generateUUID(),
      ...data,
    })
    .returning();
  if (!learningScenario) {
    throw Error('failed to create learning scenario');
  }

  const fileId = await createFile();
  await db
    .insert(LearningScenarioFileMapping)
    .values({ learningScenarioId: learningScenario.id, fileId });

  return learningScenario;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const characterInsertSchema = createInsertSchema(characterTable).omit({ accessLevel: true });
async function createCharacter(data?: Partial<z.infer<typeof characterInsertSchema>>) {
  const [character] = await db
    .insert(characterTable)
    .values({
      name: '',
      userId: generateUUID(),
      description: '',
      modelId: generateUUID(),
      ...data,
    })
    .returning();
  if (!character) {
    throw Error('failed to create character');
  }

  const fileId = await createFile();
  await db.insert(CharacterFileMapping).values({ characterId: character.id, fileId });

  return character;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const customGptInsertSchema = createInsertSchema(customGptTable).omit({ accessLevel: true });
async function createCustomGpt(data?: Partial<z.infer<typeof customGptInsertSchema>>) {
  const [customGpt] = await db
    .insert(customGptTable)
    .values({
      name: '',
      systemPrompt: '',
      userId: generateUUID(),
      ...data,
    })
    .returning();
  if (!customGpt) {
    throw Error('failed to create custom GPT');
  }

  const fileId = await createFile();
  await db.insert(CustomGptFileMapping).values({ customGptId: customGpt.id, fileId });

  return customGpt;
}

async function createFile() {
  const fileId = generateUUID();
  await db.insert(fileTable).values({ id: fileId, name: '', size: 0, type: 'plain/text' });
  return fileId;
}
