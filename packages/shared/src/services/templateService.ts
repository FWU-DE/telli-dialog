import { and, eq, inArray } from 'drizzle-orm';
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
      .select({
        federalStateId: characterTemplateMappingTable.federalStateId,
        template: characterTemplateMappingTable.characterId,
      })
      .from(characterTemplateMappingTable)
      .where(eq(characterTemplateMappingTable.characterId, templateId))
      .as('mapping');
  } else {
    subquery = db
      .select({
        federalStateId: customGptTemplateMappingTable.federalStateId,
        template: customGptTemplateMappingTable.customGptId,
      })
      .from(customGptTemplateMappingTable)
      .where(eq(customGptTemplateMappingTable.customGptId, templateId))
      .as('mapping');
  }
  const federalStateMappings = await db
    .select({ federalStateId: federalStateTable.id, template: subquery.template })
    .from(federalStateTable)
    .leftJoin(subquery, eq(subquery.federalStateId, federalStateTable.id));

  return federalStateMappings.map((mapping) => ({
    ...mapping,
    isMapped: mapping.template !== null,
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
    await db.transaction(async (tx) => {
      if (mappings.some((m) => !m.isMapped)) {
        await tx.delete(characterTemplateMappingTable).where(
          and(
            eq(characterTemplateMappingTable.characterId, templateId),
            inArray(
              characterTemplateMappingTable.federalStateId,
              mappings.filter((m) => !m.isMapped).map((m) => m.federalStateId),
            ),
          ),
        );
      }

      if (mappings.some((m) => m.isMapped)) {
        await tx
          .insert(characterTemplateMappingTable)
          .values(
            mappings
              .filter((mapping) => mapping.isMapped)
              .map((mapping) => ({
                characterId: templateId,
                federalStateId: mapping.federalStateId,
              })),
          )
          .onConflictDoNothing(); // Prevent duplicate entries
      }
    });
  } else {
    await db.transaction(async (tx) => {
      if (mappings.some((m) => !m.isMapped)) {
        await tx.delete(customGptTemplateMappingTable).where(
          and(
            eq(customGptTemplateMappingTable.customGptId, templateId),
            inArray(
              customGptTemplateMappingTable.federalStateId,
              mappings.filter((m) => !m.isMapped).map((m) => m.federalStateId),
            ),
          ),
        );
      }

      if (mappings.some((m) => m.isMapped)) {
        await tx
          .insert(customGptTemplateMappingTable)
          .values(
            mappings
              .filter((mapping) => mapping.isMapped)
              .map((mapping) => ({
                customGptId: templateId,
                federalStateId: mapping.federalStateId,
              })),
          )
          .onConflictDoNothing(); // Prevent duplicate entries
      }
    });
  }
  return getFederalStatesWithMappings(templateType, templateId);
}

/**
 * Parses a template URL to extract the template type and ID.
 *
 * @param url - The URL containing template information in format: /custom/editor/{id} or /characters/editor/{id}
 * @returns Object containing templateType and templateId
 * @throws Error if URL format is invalid or template ID is missing
 */
function parseTemplateUrl(url: string): { templateType: TemplateTypes; originalId: string } {
  const urlPattern = /\/(custom|characters)\/editor\/([a-fA-F0-9-]+)/;
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error(
      'URL Format ungültig. URL muss in einem der folgenden Formate sein: /custom/editor/{id} oder /characters/editor/{id}',
    );
  }

  const [, templateTypeRaw, originalId] = match;
  const templateType: TemplateTypes = templateTypeRaw === 'custom' ? 'custom-gpt' : 'character';

  if (!originalId) {
    throw new Error('Template ID ist erforderlich');
  }

  return { templateType, originalId };
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
  const { templateType, originalId } = parseTemplateUrl(url);

  try {
    let newTemplate;

    if (templateType === 'character') {
      newTemplate = await createCharacterTemplate(originalId);
    } else {
      // Handle custom GPT template creation
      newTemplate = await createCustomGptTemplate(originalId);
    }

    // Copy associated files
    await copyRelatedTemplateFiles(templateType, originalId, newTemplate.id);

    return newTemplate.id;
  } catch (error) {
    console.error('Error creating template from URL:', error);
    throw new Error(error instanceof Error ? error.message : 'Fehler beim Erstellen der Vorlage');
  }
}

/**
 * Copies all files associated with a template to a new template, including embeddings and text chunks.
 * Files are duplicated in S3 and database records are created for the new template.
 *
 * @param templateType - The type of template ('character' or 'custom-gpt')
 * @param templateId - The ID of the source template to copy files from
 * @param resultId - The ID of the new template to link copied files to
 * @throws Error if file copying fails, but continues with remaining files
 */
export async function copyRelatedTemplateFiles(
  templateType: TemplateTypes,
  templateId: string,
  resultId: string,
) {
  try {
    const relatedFiles =
      templateType === 'character'
        ? await dbGetRelatedCharacterFiles(templateId)
        : await dbGetRelatedCustomGptFiles(templateId);

    await Promise.all(
      relatedFiles.map(async (file) => {
        try {
          const newFileId = await duplicateFileWithEmbeddings(file.id);
          if (templateType === 'character') {
            await linkFileToCharacter(newFileId, resultId);
          } else {
            await linkFileToCustomGpt(newFileId, resultId);
          }
        } catch (error) {
          console.error(
            `Error copying file ${file.id} for ${templateType} template ${resultId}:`,
            error,
          );
          // Continue with other files even if one fails
        }
      }),
    );
  } catch (error) {
    console.error(`Error processing files for ${templateType} template ${resultId}:`, error);
    // Don't fail the entire template creation if file copying fails
  }
}

/**
 * Copies a custom GPT and creates a new one based on an existing custom GPT.
 * The new custom GPT inherits all properties from the source but can have customized
 * access level, user, and school assignments.
 *
 * @param originalId - The ID of the source custom GPT to copy
 * @param accessLevel - The access level for the new custom GPT
 * @param userId - The user ID to assign to the new custom GPT
 * @param schoolId - The school ID to assign to the new custom GPT
 * @returns Promise resolving to the newly created custom GPT object
 * @throws Error if source custom GPT is not found or custom GPT creation fails
 */
export async function copyCustomGpt(
  originalId: string,
  accessLevel: 'global' | 'school' | 'private',
  userId: string,
  schoolId: string | null
) {
  const sourceCustomGpt = await dbGetCustomGptById({ customGptId: originalId });
  if (!sourceCustomGpt) {
    throw new Error('Assistent nicht gefunden');
  }

  const newCustomGpt = {
    ...sourceCustomGpt,
    id: undefined,
    originalCustomGptId: originalId,
    accessLevel,
    userId,
    schoolId,
    isDeleted: false,
  };

  const result = await dbUpsertCustomGpt({ customGpt: newCustomGpt });
  const customGptId = result?.id;
  if (!customGptId) {
    throw new Error('Fehler beim Erstellen des Assistenten');
  }
  return result;
}

/**
 * Creates a new global custom GPT template based on an existing custom GPT.
 * The new template inherits all properties from the source but becomes a global template
 * accessible across all schools.
 *
 * @param originalId - The ID of the source custom GPT to create a template from
 * @returns Promise resolving to the newly created custom GPT template object
 * @throws Error if source custom GPT is not found or template creation fails
 */
async function createCustomGptTemplate(originalId: string) {
  return copyCustomGpt(originalId, 'global', DUMMY_USER_ID, null);
}

/**
 * Copies a character and creates a new one based on an existing character.
 * The new character inherits all properties from the source but can have customized
 * access level, user, and school assignments.
 *
 * @param originalId - The ID of the source character to copy
 * @param accessLevel - The access level for the new character
 * @param userId - The user ID to assign to the new character
 * @param schoolId - The school ID to assign to the new character
 * @returns Promise resolving to the newly created character object
 * @throws Error if source character is not found or character creation fails
 */
export async function copyCharacter(
  originalId: string,
  accessLevel: 'global' | 'school' | 'private',
  userId: string,
  schoolId: string | null
) {
  const sourceCharacter = await dbGetCharacterById({ characterId: originalId });
  if (!sourceCharacter) {
    throw new Error('Dialogpartner nicht gefunden');
  }

  const newCharacter = {
    ...sourceCharacter,
    id: undefined,
    originalCharacterId: originalId,
    accessLevel,
    userId,
    schoolId,
    isDeleted: false,
  };

  const result = await dbCreateCharacter(newCharacter, DEFAULT_CHAT_MODEL);
  const character = result?.[0];
  if (!character) {
    throw new Error('Fehler beim Erstellen des Dialogpartners');
  }
  return character;
}

/**
 * Creates a new global character template based on an existing character.
 * The new template inherits all properties from the source but becomes a global template
 * accessible across all schools.
 *
 * @param originalId - The ID of the source character to create a template from
 * @returns Promise resolving to the ID of the newly created character template
 * @throws Error if source character is not found or template creation fails
 */
async function createCharacterTemplate(originalId: string) {
  return copyCharacter(originalId, 'global', DUMMY_USER_ID, null);
}
