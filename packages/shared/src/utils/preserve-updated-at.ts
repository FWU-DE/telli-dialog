import { isDeepStrictEqual } from 'node:util';

type WithUpdatedAt = {
  updatedAt: Date;
};

// The updatedAt timestamp of an entity should not be updated if only specific keys are changed.
// This is relevant for example for the shared settings, which should not change the updatedAt timestamp.
export function getPreservedUpdatedAtForExemptedKeys<
  TEntity extends WithUpdatedAt,
  TValues extends Record<string, unknown>,
>({ entity, values, exemptedKeys }: { entity: TEntity; values: TValues; exemptedKeys: string[] }) {
  const changedKeys = getChangedKeys({ entity, values });

  if (changedKeys.length > 0 && changedKeys.every((key) => exemptedKeys.includes(key))) {
    return entity.updatedAt;
  }

  return undefined;
}

export function getChangedKeys<TEntity, TValues extends Record<string, unknown>>({
  entity,
  values,
}: {
  entity: TEntity;
  values: TValues;
}) {
  return Object.entries(values)
    .filter(([key, value]) => !isDeepStrictEqual(entity[key as keyof TEntity], value))
    .map(([key]) => key);
}
