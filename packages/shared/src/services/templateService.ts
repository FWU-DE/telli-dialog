import { eq, inArray } from 'drizzle-orm';
import { db } from '@shared/db';
import {
  characterTable,
  characterTemplateMappingTable,
  customGptTable,
  federalStateTable,
} from '@shared/db/schema';
import {
  TemplateModel,
  TemplateToFederalStateMapping,
  TemplateTypes,
} from '@shared/models/templates';

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

/* Fetch a template by its type and id. */
export async function getTemplateById(
  templateType: TemplateTypes,
  templateId: string,
): Promise<TemplateModel> {
  if (templateType === 'character') {
    const character = await db
      .select({
        id: characterTable.id,
        originalId: characterTable.originalCharacterId,
        name: characterTable.name,
        createdAt: characterTable.createdAt,
        isDeleted: characterTable.isDeleted,
      })
      .from(characterTable)
      .where(eq(characterTable.id, templateId));

    if (!character[0]) {
      throw new Error('Character template not found');
    }

    return {
      ...character[0],
      type: 'character',
    };
  } else if (templateType === 'custom-gpt') {
    const customGpt = await db
      .select({
        id: customGptTable.id,
        originalId: customGptTable.originalCustomGptId,
        name: customGptTable.name,
        createdAt: customGptTable.createdAt,
        isDeleted: customGptTable.isDeleted,
      })
      .from(customGptTable)
      .where(eq(customGptTable.id, templateId));

    if (!customGpt[0]) {
      throw new Error('Custom GPT template not found');
    }

    return {
      ...customGpt[0],
      type: 'custom-gpt',
    };
  } else {
    throw new Error('Invalid template type');
  }
}

/* Select all federal states with the mapping information for the given template. */
export async function getFederalStatesWithMappings(
  templateType: TemplateTypes,
  templateId: string,
): Promise<TemplateToFederalStateMapping[]> {
  if (templateType === 'character') {
    const subquery = db
      .select()
      .from(characterTemplateMappingTable)
      .where(eq(characterTemplateMappingTable.characterId, templateId))
      .as('mapping');

    const federalStateMappings = await db
      .select({ mappingId: subquery.id, federalStateId: federalStateTable.id })
      .from(federalStateTable)
      .leftJoin(subquery, eq(subquery.federalStateId, federalStateTable.id));

    return federalStateMappings.map((mapping) => ({
      ...mapping,
      isMapped: mapping.mappingId !== null,
    }));
  } else {
    throw new Error('not implemented');
  }
}

/* Updates template to federal state mapping by:
- adding new mappings
- deleting old mappings
 */
export async function updateTemplateMappings(
  templateType: TemplateTypes,
  templateId: string,
  mappings: TemplateToFederalStateMapping[],
): Promise<void> {
  if (templateType === 'character') {
    const mappingsToDelete = mappings
      .filter((mapping) => !!mapping.mappingId && !mapping.isMapped)
      .map((mapping) => mapping.mappingId!);

    const newMappings = mappings
      .filter((mapping) => !mapping.mappingId && mapping.isMapped)
      .map((mapping) => ({
        characterId: templateId,
        federalStateId: mapping.federalStateId,
      }));

    await db.transaction(async (tx) => {
      if (mappingsToDelete.length > 0) {
        await tx
          .delete(characterTemplateMappingTable)
          .where(inArray(characterTemplateMappingTable.id, mappingsToDelete));
      }

      if (newMappings.length > 0) {
        await tx.insert(characterTemplateMappingTable).values(newMappings);
      }
    });
  } else {
    throw new Error('not implemented');
  }
}
