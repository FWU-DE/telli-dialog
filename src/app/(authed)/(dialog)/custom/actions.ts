'use server';

import { getUser } from '@/auth/utils';
import { db } from '@/db';
import { customGptTable } from '@/db/schema';

export async function createNewCustomGptAction() {
  const user = await getUser();

  const insertedCustomGpt = (
    await db
      .insert(customGptTable)
      .values({
        name: '',
        systemPrompt: '',
        userId: user.id,
        schoolId: user.school.id,
        description: '',
        specification: '',
        promptSuggestions: [],
      })
      .returning()
  )[0];

  if (insertedCustomGpt === undefined) {
    throw Error('Could not create a new CustomGpt');
  }

  return insertedCustomGpt;
}
