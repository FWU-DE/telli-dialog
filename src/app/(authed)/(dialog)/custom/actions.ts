'use server';

import { db } from '@/db';
import { customGptTable } from '@/db/schema';
import { getUser } from '@/auth/utils';
import { dbGetAndUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';

export async function createNewCustomGptAction({
  modelId: _modelId,
}: {
  modelId: string | undefined;
}) {
  const user = await getUser();

  const llmModels = await dbGetAndUpdateLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  const model = llmModels.find((m) => m.id === _modelId) ?? llmModels[0];

  if (model === undefined) {
    throw Error('Could not find any model');
  }

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
