import { HELP_MODE_GPT_ID } from '../const';
import { dbInsertCustomGpt } from '../functions/custom-gpts';
import { type CustomGptModel } from '../schema';

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
