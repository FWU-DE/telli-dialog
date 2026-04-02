export function isDefined<TValue>(value: TValue | undefined): value is TValue {
  return value !== undefined;
}

export function isNotNull<TValue>(value: TValue | null): value is TValue {
  return value !== null;
}

export function getDefinedOrThrow<T>(value: T | undefined, symbolName: string): T {
  if (value === undefined) throw Error(`Expected ${symbolName} to be defined.`);
  return value;
}
