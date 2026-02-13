export type TemplateTypes = 'character' | 'custom-gpt' | 'learning-scenario';

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
  isMapped: boolean;
};

/**** Guards ****/

export function isTemplateType(templateType: string): templateType is TemplateTypes {
  return (
    templateType === 'character' ||
    templateType === 'custom-gpt' ||
    templateType === 'learning-scenario'
  );
}
