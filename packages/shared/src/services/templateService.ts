import { eq, inArray } from 'drizzle-orm';
import { db } from '@shared/db';
import {
  characterTable,
  characterTemplateMappingTable,
  customGptTable,
  customGptTemplateMappingTable,
  federalStateTable,
} from '@shared/db/schema';
import {
  TemplateModel,
  TemplateToFederalStateMapping,
  TemplateTypes,
} from '@shared/models/templates';
import { dbGetCharacterById, dbCreateCharacter } from '@shared/db/functions/character';
import { dbGetCustomGptById, dbUpsertCustomGpt } from '@shared/db/functions/custom-gpts';
import { dbGetRelatedCharacterFiles, dbGetRelatedCustomGptFiles } from '@shared/db/functions/files';
import { DUMMY_USER_ID } from '@shared/db/seed/user-entity';
import { DEFAULT_CHAT_MODEL } from '@shared/db/seed/default-characters';
import {
  duplicateFileWithEmbeddings,
  linkFileToCharacter,
  linkFileToCustomGpt,
} from './fileService';

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

/** Fetch all character templates from the database. */
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

/** Fetch all custom GPT templates from the database. */
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

/** Fetch a template by its type and id. */
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

/** Select all federal states with the mapping information for the given template. */
export async function getFederalStatesWithMappings(
  templateType: TemplateTypes,
  templateId: string,
): Promise<TemplateToFederalStateMapping[]> {
  let subquery;
  if (templateType === 'character') {
    subquery = db
      .select()
      .from(characterTemplateMappingTable)
      .where(eq(characterTemplateMappingTable.characterId, templateId))
      .as('mapping');
  } else {
    subquery = db
      .select()
      .from(customGptTemplateMappingTable)
      .where(eq(customGptTemplateMappingTable.customGptId, templateId))
      .as('mapping');
  }
  const federalStateMappings = await db
    .select({ mappingId: subquery.id, federalStateId: federalStateTable.id })
    .from(federalStateTable)
    .leftJoin(subquery, eq(subquery.federalStateId, federalStateTable.id));

  return federalStateMappings.map((mapping) => ({
    ...mapping,
    isMapped: mapping.mappingId !== null,
  }));
}

/** Updates template to federal state mapping by:
 * - adding new mappings
 * - deleting old mappings
 *
 */
export async function updateTemplateMappings(
  templateType: TemplateTypes,
  templateId: string,
  mappings: TemplateToFederalStateMapping[],
): Promise<TemplateToFederalStateMapping[]> {
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
    const mappingsToDelete = mappings
      .filter((mapping) => !!mapping.mappingId && !mapping.isMapped)
      .map((mapping) => mapping.mappingId!);

    const newMappings = mappings
      .filter((mapping) => !mapping.mappingId && mapping.isMapped)
      .map((mapping) => ({
        customGptId: templateId,
        federalStateId: mapping.federalStateId,
      }));

    await db.transaction(async (tx) => {
      if (mappingsToDelete.length > 0) {
        await tx
          .delete(customGptTemplateMappingTable)
          .where(inArray(customGptTemplateMappingTable.id, mappingsToDelete));
      }

      if (newMappings.length > 0) {
        await tx.insert(customGptTemplateMappingTable).values(newMappings);
      }
    });
  }
  return getFederalStatesWithMappings(templateType, templateId);
}

/**
 * Creates a template from URL by parsing the URL, extracting template type and ID,
 * and creating a new global template based on the existing template.
 *
 * @param url - The URL containing template information in format: /custom/editor/{id} or /characters/editor/{id}
 * @returns Promise with success result containing templateId, templateType, and message
 * @throws Error if URL format is invalid, template ID is missing, or template creation fails
 */
export async function createTemplateFromUrl(url: string): Promise<string> {
  // Parse the URL to extract template type and ID
  const urlPattern = /\/(custom|characters)\/editor\/([a-fA-F0-9-]+)/;
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error(
      'URL Format ungültig. URL muss in einem der folgenden Formate sein: /custom/editor/{id} oder /characters/editor/{id}',
    );
  }

  const [, templateTypeRaw, templateId] = match;
  const templateType: TemplateTypes = templateTypeRaw === 'custom' ? 'custom-gpt' : 'character';

  if (!templateId) {
    throw new Error('Template ID ist erforderlich');
  }

  try {
    if (templateType === 'character') {
      const sourceCharacter = await dbGetCharacterById({ characterId: templateId });
      if (!sourceCharacter) {
        throw new Error('Charakter nicht gefunden');
      }

      const newCharacter = {
        ...sourceCharacter,
        id: undefined,
        originalCharacterId: templateId,
        accessLevel: 'global' as const,
        userId: DUMMY_USER_ID,
        schoolId: null,
        isDeleted: false,
      };

      const result = await dbCreateCharacter(newCharacter, DEFAULT_CHAT_MODEL);
      const resultId = result?.[0]?.id;
      if (!resultId) {
        throw new Error('Fehler beim Erstellen der Charakter-Vorlage');
      }

      // Copy associated files
      try {
        const relatedFiles = await dbGetRelatedCharacterFiles(templateId);
        await Promise.all(
          relatedFiles.map(async (file) => {
            try {
              const newFileId = await duplicateFileWithEmbeddings(file.id);
              await linkFileToCharacter(newFileId, resultId);
            } catch (error) {
              console.error(
                `Error copying file ${file.id} for character template ${resultId}:`,
                error,
              );
              // Continue with other files even if one fails
            }
          }),
        );
      } catch (error) {
        console.error(`Error processing files for character template ${resultId}:`, error);
        // Don't fail the entire template creation if file copying fails
      }

      return resultId;
    } else {
      const sourceCustomGpt = await dbGetCustomGptById({ customGptId: templateId });
      if (!sourceCustomGpt) {
        throw new Error('Custom GPT nicht gefunden');
      }

      const newCustomGpt = {
        ...sourceCustomGpt,
        id: undefined,
        originalCustomGptId: templateId,
        accessLevel: 'global' as const,
        userId: DUMMY_USER_ID,
        schoolId: null,
        isDeleted: false,
      };

      const result = await dbUpsertCustomGpt({ customGpt: newCustomGpt });
      const resultId = result?.id;
      if (!resultId) {
        throw new Error('Fehler beim Erstellen der Custom GPT-Vorlage');
      }

      // Copy associated files
      try {
        const relatedFiles = await dbGetRelatedCustomGptFiles(templateId);
        await Promise.all(
          relatedFiles.map(async (file) => {
            try {
              const newFileId = await duplicateFileWithEmbeddings(file.id);
              await linkFileToCustomGpt(newFileId, resultId);
            } catch (error) {
              console.error(
                `Error copying file ${file.id} for custom GPT template ${resultId}:`,
                error,
              );
              // Continue with other files even if one fails
            }
          }),
        );
      } catch (error) {
        console.error(`Error processing files for custom GPT template ${resultId}:`, error);
        // Don't fail the entire template creation if file copying fails
      }

      return resultId;
    }
  } catch (error) {
    console.error('Error creating template from URL:', error);
    throw new Error(error instanceof Error ? error.message : 'Fehler beim Erstellen der Vorlage');
  }
}
