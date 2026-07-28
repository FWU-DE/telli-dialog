import { InvalidArgumentError } from '@shared/error';

export const ENTITY_TYPES = ['assistant', 'character', 'learningScenario'] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export type EntityRef = {
  entityType: EntityType;
  entityId: string;
};

export const URL_ENTITY_TYPES = ['assistant', 'character', 'learning-scenario'] as const;

export type UrlEntityType = (typeof URL_ENTITY_TYPES)[number];

export function mapEntityTypeToUrlEntityType(entityType: EntityType): UrlEntityType {
  if (entityType === 'learningScenario') {
    return 'learning-scenario';
  }

  return entityType;
}

export function mapUrlEntityTypeToEntityType(urlEntityType: UrlEntityType): EntityType {
  if (urlEntityType === 'learning-scenario') {
    return 'learningScenario';
  }

  return urlEntityType;
}

export function assertEntityType(entityType: string): asserts entityType is EntityType {
  if (!ENTITY_TYPES.includes(entityType as EntityType)) {
    throwEntityInvalidArgumentError();
  }
}

export function throwEntityInvalidArgumentError(): never {
  throw new InvalidArgumentError('Unsupported entity type');
}
