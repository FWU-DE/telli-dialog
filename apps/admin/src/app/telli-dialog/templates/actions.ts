'use server';
import { getTemplates } from '@telli/shared/services/templateService';
import { TemplateTypes } from '@shared/models/templates';
import { dbGetCharacterById, dbCreateCharacter } from '@shared/db/functions/character';
import { dbGetCustomGptById, dbUpsertCustomGpt } from '@shared/db/functions/custom-gpts';
import { DUMMY_USER_ID } from '@shared/db/seed/user-entity';
import { DEFAULT_CHAT_MODEL } from '@shared/db/seed/default-characters';

export async function getTemplatesAction() {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return getTemplates();
}

export async function createTemplateFromUrlAction(url: string) {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

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
