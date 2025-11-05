'use server';
import { TemplateToFederalStateMapping, TemplateTypes } from '@shared/models/templates';
import {
  getFederalStatesWithMappings,
  getTemplateById,
  updateTemplateMappings,
} from '@telli/shared/services/templateService';

export async function getTemplateByIdAction(templateType: TemplateTypes, templateId: string) {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return getTemplateById(templateType, templateId);
}

export async function getFederalStatesWithMappingsAction(
  templateType: TemplateTypes,
  templateId: string,
) {
  return getFederalStatesWithMappings(templateType, templateId);
}

export async function updateTemplateMappingsAction(
  templateType: TemplateTypes,
  templateId: string,
  mappings: TemplateToFederalStateMapping,
) {
  return updateTemplateMappings(templateType, templateId, mappings);
}
