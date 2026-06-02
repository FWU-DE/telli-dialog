import { InvalidArgumentError } from '@shared/error';

export const ENTITY_TYPES = ['assistant', 'character', 'learningScenario'] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export type EntityRef = {
  entityType: EntityType;
  entityId: string;
};

export const KEBAB_ENTITY_TYPES = ['assistant', 'character', 'learning-scenario'] as const;

export type KebabEntityType = (typeof KEBAB_ENTITY_TYPES)[number];

export function mapEntityTypeToKebabEntityType(entityType: EntityType): KebabEntityType {
  if (entityType === 'learningScenario') {
    return 'learning-scenario';
  }

  return entityType;
}

export function mapKebabEntityTypeToEntityType(kebabEntityType: KebabEntityType): EntityType {
  if (kebabEntityType === 'learning-scenario') {
    return 'learningScenario';
  }

  return kebabEntityType;
}

export function assertEntityType(entityType: string): asserts entityType is EntityType {
  if (!ENTITY_TYPES.includes(entityType as EntityType)) {
    throwEntityInvalidArgumentError();
  }
}

export function throwEntityInvalidArgumentError(): never {
  throw new InvalidArgumentError('Unsupported entity type');
}
