export function parseNumberOrThrow(value: string): number {
  const maybeNumber = Number(value);
  if (isNaN(maybeNumber)) {
    throw Error(`Expected '${value}' to be a number`);
  }
  return maybeNumber;
}

export function parseNumberOrDefault(value: string | number, defaultValue: number): number {
  const maybeNumber = Number(value);
  if (isNaN(maybeNumber)) return defaultValue;
  return maybeNumber;
}
