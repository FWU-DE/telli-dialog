'use server';
import { requireAdminOrEditorAuth } from '@/auth/requireAdminAuth';
import { TemplateToFederalStateMapping, TemplateTypes } from '@shared/templates/template';
import {
  getFederalStatesWithMappings,
  getTemplateById,
  updateAuthorOfTemplate,
  updateTemplateMappings,
} from '@ais-chat/shared/templates/template-service';

export async function getTemplateByIdAction(templateType: TemplateTypes, templateId: string) {
  await requireAdminOrEditorAuth();

  return getTemplateById(templateType, templateId);
}

export async function updateAuthorOfTemplateAction(
  templateType: TemplateTypes,
  templateId: string,
  newAuthor: string,
) {
  await requireAdminOrEditorAuth();

  return updateAuthorOfTemplate(templateType, templateId, newAuthor);
}

export async function getFederalStatesWithMappingsAction(
  templateType: TemplateTypes,
  templateId: string,
) {
  await requireAdminOrEditorAuth();

  return getFederalStatesWithMappings(templateType, templateId);
}

export async function updateTemplateMappingsAction(
  templateType: TemplateTypes,
  templateId: string,
  mappings: TemplateToFederalStateMapping[],
) {
  await requireAdminOrEditorAuth();

  return updateTemplateMappings(templateType, templateId, mappings);
}
