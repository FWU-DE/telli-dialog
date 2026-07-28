import { URL_ENTITY_TYPES, UrlEntityType } from '@shared/entities/entity-types';

export type TemplateTypes = UrlEntityType;

/* Unified template model for assistants, characters and learning scenarios. */
export type TemplateModel = {
  id: string;
  originalId: string | null;
  author: string;
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
  return (URL_ENTITY_TYPES as readonly string[]).includes(templateType);
}
