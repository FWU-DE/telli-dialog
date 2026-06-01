export const ENTITY_TYPES = ['assistant', 'character', 'learningScenario'] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export type EntityRef = {
  entityType: EntityType;
  entityId: string;
};

export const KEBAP_ENTITY_TYPES = ['assistant', 'character', 'learning-scenario'] as const;

export type KebabEntityType = (typeof KEBAP_ENTITY_TYPES)[number];

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
