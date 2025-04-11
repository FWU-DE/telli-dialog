import { dbInsertCustomGpt } from '../functions/custom-gpts';
import { type CustomGptModel } from '../schema';

export const HELP_MODE_GPT_ID = 'e0c2f4a0-9a11-4271-bf3f-e3b368299e5f';

const hilfeModusGpt: CustomGptModel = {
  id: HELP_MODE_GPT_ID,
  name: 'Hilfe-Assistent',
  systemPrompt: '',
  userId: null,
  createdAt: new Date(),
  accessLevel: 'global',
  promptSuggestions: [],
  description: null,
  pictureId: null,
  schoolId: null,
  specification: null,
};

export async function insertHelpModeGpt({ skip = true }: { skip: boolean }) {
  if (skip) return;

  return await dbInsertCustomGpt({ customGpt: hilfeModusGpt });
}
