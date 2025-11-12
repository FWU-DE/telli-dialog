export type TemplateTypes = 'character' | 'custom-gpt';

/* Unified template model for characters and custom GPTs */
export type TemplateModel = {
  id: string;
  originalId: string | null;
  type: TemplateTypes;
  name: string;
  createdAt: Date;
  isDeleted: boolean;
};

export type TemplateToFederalStateMapping = {
  federalStateId: string;
  mappingId: string | null;
  isMapped: boolean;
};

export type CreateTemplateFromUrlResult = {
  success: true;
  templateId: string;
  templateType: TemplateTypes;
  message: string;
};

/**** Guards ****/

export function isTemplateType(templateType: string): templateType is TemplateTypes {
  return templateType === 'character' || templateType === 'custom-gpt';
}
