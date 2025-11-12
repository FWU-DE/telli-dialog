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
  CreateTemplateFromUrlResult,
} from '@shared/models/templates';
import { dbGetCharacterById, dbCreateCharacter } from '@shared/db/functions/character';
import { dbGetCustomGptById, dbUpsertCustomGpt } from '@shared/db/functions/custom-gpts';
import { dbGetRelatedCharacterFiles, dbGetRelatedCustomGptFiles } from '@shared/db/functions/files';
import { DUMMY_USER_ID } from '@shared/db/seed/user-entity';
import { DEFAULT_CHAT_MODEL } from '@shared/db/seed/default-characters';
import { readFileFromS3, uploadFileToS3 } from '@shared/s3';
import { customAlphabet } from 'nanoid';
import { fileTable, TextChunkTable, CharacterFileMapping, CustomGptFileMapping } from '@shared/db/schema';

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
}

/**
 * Copies a file and all its related text chunks and embeddings for template creation.
 * This preserves all existing processing (embeddings, chunks, metadata) while creating
 * a clean copy with a new file ID.
 * 
 * @param originalFileId - The ID of the original file to copy
 * @returns Promise with the new file ID
 */
async function copyFileForTemplate(originalFileId: string): Promise<string> {
  const cnanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 24);
  const newFileId = `file_${cnanoid()}`;

  try {
    // Get original file record
    const [originalFile] = await db.select().from(fileTable).where(eq(fileTable.id, originalFileId));
    if (!originalFile) {
      throw new Error(`Original file not found: ${originalFileId}`);
    }

    // Get all text chunks for the original file
    const originalChunks = await db
      .select()
      .from(TextChunkTable)
      .where(eq(TextChunkTable.fileId, originalFileId));

    // Read the original file from S3
    const fileContent = await readFileFromS3({ key: `message_attachments/${originalFileId}` });

    await db.transaction(async (tx) => {
      // Create new file record with new ID
      await tx.insert(fileTable).values({
        ...originalFile,
        id: newFileId,
      });

      // Copy all chunks with new file ID (remove id to let DB generate new ones)
      if (originalChunks.length > 0) {
        const newChunks = originalChunks.map(chunk => ({
          ...chunk,
          id: undefined as any, // Let DB generate new ID
          fileId: newFileId,
        }));
        await tx.insert(TextChunkTable).values(newChunks);
      }
    });

    // Upload file to new location in S3
    await uploadFileToS3({
      key: `message_attachments/${newFileId}`,
      body: fileContent,
      contentType: originalFile.type,
    });

    return newFileId;
  } catch (error) {
    console.error(`Error copying file from ${originalFileId}:`, error);
    throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Links a file to a character by creating a mapping record.
 * 
 * @param fileId - The ID of the file to link
 * @param characterId - The ID of the character to link to
 */
async function linkFileToCharacterInTemplate(fileId: string, characterId: string): Promise<void> {
  await db.insert(CharacterFileMapping).values({
    fileId,
    characterId,
  });
}

/**
 * Links a file to a custom GPT by creating a mapping record.
 * 
 * @param fileId - The ID of the file to link
 * @param customGptId - The ID of the custom GPT to link to
 */
async function linkFileToCustomGptInTemplate(fileId: string, customGptId: string): Promise<void> {
  await db.insert(CustomGptFileMapping).values({
    fileId,
    customGptId,
  });
}

/**
 * Creates a template from URL by parsing the URL, extracting template type and ID,
 * and creating a new global template based on the existing template.
 * 
 * @param url - The URL containing template information in format: /custom/editor/{id} or /characters/editor/{id}
 * @returns Promise with success result containing templateId, templateType, and message
 * @throws Error if URL format is invalid, template ID is missing, or template creation fails
 */
export async function createTemplateFromUrl(url: string): Promise<CreateTemplateFromUrlResult> {
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
        name: sourceCharacter.name,
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
              const newFileId = await copyFileForTemplate(file.id);
              await linkFileToCharacterInTemplate(newFileId, resultId);
            } catch (error) {
              console.error(`Error copying file ${file.id} for character template ${resultId}:`, error);
              // Continue with other files even if one fails
            }
          }),
        );
      } catch (error) {
        console.error(`Error processing files for character template ${resultId}:`, error);
        // Don't fail the entire template creation if file copying fails
      }

      return {
        success: true,
        templateId: resultId,
        templateType: 'character',
        message: 'Charakter-Vorlage erfolgreich erstellt',
      };
    } else {
      const sourceCustomGpt = await dbGetCustomGptById({ customGptId: templateId });
      if (!sourceCustomGpt) {
        throw new Error('Custom GPT nicht gefunden');
      }

      const newCustomGpt = {
        ...sourceCustomGpt,
        id: undefined,
        name: sourceCustomGpt.name,
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
              const newFileId = await copyFileForTemplate(file.id);
              await linkFileToCustomGptInTemplate(newFileId, resultId);
            } catch (error) {
              console.error(`Error copying file ${file.id} for custom GPT template ${resultId}:`, error);
              // Continue with other files even if one fails
            }
          }),
        );
      } catch (error) {
        console.error(`Error processing files for custom GPT template ${resultId}:`, error);
        // Don't fail the entire template creation if file copying fails
      }

      return {
        success: true,
        templateId: resultId,
        templateType: 'custom-gpt',
        message: 'Custom GPT-Vorlage erfolgreich erstellt',
      };
    }
  } catch (error) {
    console.error('Error creating template from URL:', error);
    throw new Error(error instanceof Error ? error.message : 'Fehler beim Erstellen der Vorlage');
  }
}
