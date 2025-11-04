'use server';
import { TemplateTypes } from '@shared/models/templates';
import { getFederalStateIds, getTemplateById } from '@telli/shared/services/templateService';

export async function getTemplateByIdAction(templateType: TemplateTypes, templateId: string) {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return getTemplateById(templateType, templateId);
}

export async function getFederalStateIdsAction() {
  return getFederalStateIds();
}
