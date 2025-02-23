'use server';

import { getUser } from '@/auth/utils';
import { dbGetCharacterById } from '@/db/functions/character';
import { uploadFileToS3 } from '@/s3';
import { blobToBuffer } from '@/utils/files/utils';

export async function saveFileAction(formData: FormData) {
  const user = await getUser();
  const file = formData.get('file');
  console.debug({ file });

  if (file === null || typeof file === 'string') {
    throw Error('Expected file to be of type File');
  }

  const fileName = file.name;

  const characterId = formData.get('characterId')?.toString();

  if (characterId !== undefined) {
    const character = await dbGetCharacterById({ id: characterId });
    if (character === undefined) {
      throw Error(`Could not find character with id ${characterId}`);
    }
    if (character.userId !== user.id) {
      throw Error(`Character '${characterId}' does not belong to user '${user.id}'`);
    }

    const imagePath = `characters/${characterId}/${fileName}`;
    await uploadFileToS3({
      key: imagePath,
      body: await blobToBuffer(file),
      contentType: file.type,
    });
    return imagePath;
  }

  throw Error('Could not upload picture as no branch was matched.');
}
