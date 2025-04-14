// Remove null and undefined values from an object
export default function removeNullValues<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== null),
  ) as Partial<T>;
}
