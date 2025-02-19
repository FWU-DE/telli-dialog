'use server';

import { db } from '@/db';
import { characterTable } from '@/db/schema';
import { getUser } from '@/auth/utils';

export async function createNewCharacterAction() {
  const user = await getUser();

  const insertedCharacter = (
    await db
      .insert(characterTable)
      .values({ name: '', userId: user.id, schoolId: user.school?.id ?? null })
      .returning()
  )[0];

  if (insertedCharacter === undefined) {
    throw Error('Could not create a new character');
  }

  return insertedCharacter;
}
