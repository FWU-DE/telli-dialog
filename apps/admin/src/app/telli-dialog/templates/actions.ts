'use server';
import { getTemplates, createTemplateFromUrl } from '@telli/shared/services/templateService';

export async function getTemplatesAction() {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return getTemplates();
}

export async function createTemplateFromUrlAction(url: string) {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  return createTemplateFromUrl(url);
}
