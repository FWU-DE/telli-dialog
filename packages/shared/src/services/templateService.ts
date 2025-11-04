import { eq } from 'drizzle-orm';
import { db } from '../db';
import { characterTable, customGptTable } from '../db/schema';

/* Unified template model for characters and custom GPTs */
export type TemplateModel = {
  id: string;
  originalId: string | null;
  type: 'character' | 'custom-gpt';
  name: string;
  createdAt: Date;
  isDeleted: boolean;
};

/**
 * Fetch all global templates from the database, including deleted templates.
 * This function is used in admin ui to manage global templates.
 * @returns A list of all global templates
 */
export async function getTemplates(): Promise<TemplateModel[]> {
  const [characterTemplates, customGptTemplates] = await Promise.all([
    getCharacters(),
    getCustomGpt(),
  ]);

  return [...characterTemplates, ...customGptTemplates];
}

/* Fetch all character templates from the database. */
async function getCharacters(): Promise<TemplateModel[]> {
  const templates = await db
    .select({
      id: characterTable.id,
      name: characterTable.name,
      createdAt: characterTable.createdAt,
      originalId: characterTable.originalCharacterId,
      isDeleted: characterTable.isDeleted,
    })
    .from(characterTable)
    .where(eq(characterTable.accessLevel, 'global'));

  return templates.map((template) => ({
    ...template,
    type: 'character',
  }));
}

/* Fetch all custom GPT templates from the database. */
async function getCustomGpt(): Promise<TemplateModel[]> {
  const templates = await db
    .select({
      id: customGptTable.id,
      name: customGptTable.name,
      createdAt: customGptTable.createdAt,
      originalId: customGptTable.originalCustomGptId,
      isDeleted: customGptTable.isDeleted,
    })
    .from(customGptTable)
    .where(eq(customGptTable.accessLevel, 'global'));

  return templates.map((template) => ({
    ...template,
    type: 'custom-gpt',
  }));
}
