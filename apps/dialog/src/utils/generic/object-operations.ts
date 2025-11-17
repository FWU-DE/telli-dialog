export function removeNullishValues<T extends Record<string, unknown>>(
  obj: T | undefined,
): Partial<T> | undefined {
  if (obj === undefined) return undefined;
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined),
  ) as Partial<T>;
}
