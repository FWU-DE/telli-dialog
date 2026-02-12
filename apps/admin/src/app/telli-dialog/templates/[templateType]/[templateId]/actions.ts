'use server';
import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { TemplateToFederalStateMapping, TemplateTypes } from '@shared/templates/template';
import {
  getFederalStatesWithMappings,
  getTemplateById,
  updateTemplateMappings,
} from '@telli/shared/templates/template-service';

export async function getTemplateByIdAction(templateType: TemplateTypes, templateId: string) {
  await requireAdminAuth();

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
