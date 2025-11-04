'use server';
import { getTemplates } from '@telli/shared/services/templateService';

export async function getTemplatesAction() {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return getTemplates();
}
