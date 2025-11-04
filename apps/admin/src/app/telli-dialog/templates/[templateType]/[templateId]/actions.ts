'use server';
import { getTemplateById } from '@telli/shared/services/templateService';

export async function getTemplateByIdAction(templateType: string, templateId: string) {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return getTemplateById(templateType, templateId);
}
