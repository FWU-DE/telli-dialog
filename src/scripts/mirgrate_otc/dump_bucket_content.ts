import { db } from '@/db';
import { eq, isNotNull, and, ne } from 'drizzle-orm';
import { characterTable, customGptTable, fileTable } from '@/db/schema';
import { readFileFromS3 } from '@/s3';
import fs from 'fs';

export async function dumpBucketContent(exportDirectory: string) {
  const activeCharacters = await db
    .select()
    .from(characterTable)
    .where(and(isNotNull(characterTable.pictureId), ne(characterTable.accessLevel, 'global')));

  for (const character of activeCharacters) {
    const characterId = character.id;
    const pictureId = character.pictureId;
    if (!pictureId) {
      continue;
    }
    const contents = await readFileFromS3({ key: `${pictureId}` });
    // Create the export directory and parent directories if they don't exist
    console.log(`dumping ${character.name} to ${exportDirectory}/characters/${characterId}/avatar`);
    if (!fs.existsSync(`${exportDirectory}/characters/${characterId}`)) {
      fs.mkdirSync(`${exportDirectory}/characters/${characterId}`, { recursive: true });
    }
    fs.writeFileSync(`${exportDirectory}/characters/${characterId}/avatar`, contents);
  }

  const activeCustomGpts = await db.select().from(customGptTable).where(isNotNull(customGptTable.pictureId));
  for (const customGpt of activeCustomGpts) {
    const customGptId = customGpt.id;
    const pictureId = customGpt.pictureId;
    if (!pictureId) {
      continue;
    }
    const contents = await readFileFromS3({ key: `${pictureId}` });
    console.log(`dumping ${customGpt.name} to ${exportDirectory}/custom-gpts/${customGptId}/avatar`);
    if (!fs.existsSync(`${exportDirectory}/custom-gpts/${customGptId}`)) {
      fs.mkdirSync(`${exportDirectory}/custom-gpts/${customGptId}`, { recursive: true });
    }
    fs.writeFileSync(`${exportDirectory}/custom-gpts/${customGptId}/avatar`, contents);
  }
  const activeFiles = await db.select().from(fileTable);
  for (const file of activeFiles) {
    const fileId = file.id;
    const contents = await readFileFromS3({ key: `message_attachments/${fileId}` });
    console.log(`dumping ${fileId} to ${exportDirectory}/message_attachments/${fileId}`);
    if (!fs.existsSync(`${exportDirectory}/message_attachments`)) {
      fs.mkdirSync(`${exportDirectory}/message_attachments`, { recursive: true });
    }
    fs.writeFileSync(`${exportDirectory}/message_attachments/${fileId}`, contents);
  }
}

dumpBucketContent('./export');
