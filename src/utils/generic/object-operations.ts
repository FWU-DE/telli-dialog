export function removeNullValues<T extends Record<string, unknown>>(
  obj: T | undefined,
): Partial<T> | undefined {
  if (obj === undefined) return undefined;
  return Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined),
  ) as Partial<T>;
}
