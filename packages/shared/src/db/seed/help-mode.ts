import { HELP_MODE_GPT_ID } from '../const';
import { dbUpsertCustomGpt } from '../functions/custom-gpts';
import { type CustomGptInsertModel } from '../schema';
import { logInfo } from '@shared/logging';

const hilfeModusGpt: CustomGptInsertModel & { id: string } = {
  id: HELP_MODE_GPT_ID,
  name: 'Hilfe-Assistent',
  systemPrompt: '',
  userId: null,
  accessLevel: 'global',
  promptSuggestions: [],
  description: null,
  pictureId: null,
  schoolId: null,
  specification: null,
};

export async function insertHelpModeGpt({ skip = true }: { skip: boolean }) {
  if (skip) return;

  const result = await dbUpsertCustomGpt({ customGpt: hilfeModusGpt });
  logInfo('helpMode seed successful');
  return result;
}
