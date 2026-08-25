'use server';
import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import { TemplateToFederalStateMapping, TemplateTypes } from '@shared/templates/template';
import {
  getFederalStatesWithMappings,
  getTemplateById,
  updateAuthorOfTemplate,
  updateTemplateDeletedState,
  updateTemplateMappings,
} from '@ais-chat/shared/templates/template-service';

export async function getTemplateByIdAction(templateType: TemplateTypes, templateId: string) {
  await requireAdminAuth();

  return getTemplateById(templateType, templateId);
}

export async function updateAuthorOfTemplateAction(
  templateType: TemplateTypes,
  templateId: string,
  newAuthor: string,
) {
  await requireAdminAuth();

  return runServerAction('updateAuthorOfTemplateAction', updateAuthorOfTemplate)(
    templateType,
    templateId,
    newAuthor,
  );
}

export async function updateTemplateDeletedStateAction(
  templateType: TemplateTypes,
  templateId: string,
  isDeleted: boolean,
) {
  await requireAdminAuth();

  return runServerAction('updateTemplateDeletedStateAction', updateTemplateDeletedState)(
    templateType,
    templateId,
    isDeleted,
  );
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
