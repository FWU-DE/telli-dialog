'use server';
import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { TemplateToFederalStateMapping, TemplateTypes } from '@shared/models/templates';
import {
  getFederalStatesWithMappings,
  getTemplateById,
  updateTemplateMappings,
} from '@telli/shared/services/templateService';

export async function getTemplateByIdAction(templateType: TemplateTypes, templateId: string) {
  await requireAdminAuth();

  // Todo: error handling
  return getTemplateById(templateType, templateId);
}

export async function getFederalStatesWithMappingsAction(
  templateType: TemplateTypes,
  templateId: string,
) {
  await requireAdminAuth();

  return getFederalStatesWithMappings(templateType, templateId);
}

export async function updateTemplateMappingsAction(
  templateType: TemplateTypes,
  templateId: string,
  mappings: TemplateToFederalStateMapping[],
) {
  await requireAdminAuth();

  return updateTemplateMappings(templateType, templateId, mappings);
}
