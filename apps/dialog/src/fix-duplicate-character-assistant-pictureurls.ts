import { and, eq, isNotNull, ne, sql } from 'drizzle-orm';
import { db } from '@shared/db';
import {
  characterTable,
  CharacterUpdateModel,
  CustomGptInsertModel,
  customGptTable,
} from '@shared/db/schema';
import { logError, logInfo } from '@shared/logging';
import { copyFileInS3 } from '@shared/s3';

/**
 * Advisory lock helper.
 */
async function withAdvisoryLock(key1: number, key2: number, callback: () => Promise<void>) {
  const pool = db.$client;
  await pool.query(`SELECT pg_advisory_lock($1, $2)`, [key1, key2]);
  try {
    await callback();
  } finally {
    await pool.query(`SELECT pg_advisory_unlock($1, $2)`, [key1, key2]);
  }
}

function dbGetCharactersWithInvalidPictureIds() {
  return db
    .select()
    .from(characterTable)
    .where(
      and(
        isNotNull(characterTable.pictureId),
        ne(characterTable.pictureId, sql`'characters/' || ${characterTable.id} || '/avatar'`),
        ne(characterTable.accessLevel, 'global'),
      ),
    );
}

async function dbUpdateCharacter(id: string, character: Partial<CharacterUpdateModel>) {
  const [updated] = await db
    .update(characterTable)
    .set(character)
    .where(eq(characterTable.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Failed to update character with id ${id}`);
  }

  return updated;
}

function dbGetCustomGptsWithInvalidPictureIds() {
  return db
    .select()
    .from(customGptTable)
    .where(
      and(
        isNotNull(customGptTable.pictureId),
        ne(customGptTable.pictureId, sql`'custom-gpts/' || ${customGptTable.id} || '/avatar'`),
        ne(customGptTable.accessLevel, 'global'),
      ),
    );
}

async function dbUpdateCustomGpt(id: string, customGpt: Partial<CustomGptInsertModel>) {
  const [updated] = await db
    .update(customGptTable)
    .set(customGpt)
    .where(eq(customGptTable.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Failed to update character with id ${id}`);
  }

  return updated;
}

async function migrateCharacters() {
  const characters = await dbGetCharactersWithInvalidPictureIds();
  if (characters.length > 0) {
    logInfo(`Found ${characters.length} characters with invalid picture ids.`);

    for (const character of characters) {
      const oldPictureId = character.pictureId!;
      const newPictureId = `characters/${character.id}/avatar`;
      try {
        logInfo(
          `Copying S3 picture ${oldPictureId} to ${newPictureId} for character ${character.id}`,
        );
        await copyFileInS3({
          copySource: oldPictureId,
          newKey: newPictureId,
        });
        await dbUpdateCharacter(character.id, { pictureId: newPictureId });
      } catch (error) {
        logError(`Failed to fix invalid picture id for character ${character.id}`, error);
      }
    }
  }
}

async function migrateCustomGpts() {
  const gpts = await dbGetCustomGptsWithInvalidPictureIds();
  if (gpts.length > 0) {
    logInfo(`Found ${gpts.length} custom gpts with invalid picture ids.`);

    for (const gpt of gpts) {
      const oldPictureId = gpt.pictureId!;
      const newPictureId = `custom-gpts/${gpt.id}/avatar`;
      try {
        logInfo(`Copying S3 picture ${oldPictureId} to ${newPictureId} for custom gpt ${gpt.id}`);
        await copyFileInS3({
          copySource: oldPictureId,
          newKey: newPictureId,
        });
        await dbUpdateCustomGpt(gpt.id, { pictureId: newPictureId });
      } catch (error) {
        logError(`Failed to fix invalid picture id for custom gpt ${gpt.id}`, error);
      }
    }
  }
}

/**
 * Fixes characters and custom gpts with invalid picture ids.
 * This ensures that every character and custom gpt has its own picture id in the format
 * `characters/${id}/avatar` or `custom-gpts/${id}/avatar`.
 */
export async function fixInvalidPictureIds() {
  logInfo('Starting migration to fix invalid picture ids...');

  const LOCK_KEY1 = 1000;
  const LOCK_KEY2 = 100002;

  await withAdvisoryLock(LOCK_KEY1, LOCK_KEY2, async () => {
    await migrateCharacters();
    await migrateCustomGpts();
  });

  logInfo('Completed fix for invalid picture ids.');
}
