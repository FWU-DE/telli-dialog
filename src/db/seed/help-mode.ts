import { dbInsertCustomGpt } from '../functions/custom-gpts';
import { type CustomGptModel } from '../schema';

const hilfeModusGpt: CustomGptModel = {
  id: 'e0c2f4a0-9a11-4271-bf3f-e3b368299e5f',
  name: 'Hilfe-Assistent',
  systemPrompt: '',
  userId: null,
  createdAt: new Date(),
};

export async function insertHelpModeGpt({ skip = true }: { skip: boolean }) {
  if (skip) return;

  return await dbInsertCustomGpt({ customGpt: hilfeModusGpt });
}
