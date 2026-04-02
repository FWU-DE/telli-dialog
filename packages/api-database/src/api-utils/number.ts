export function getNumberOrDefault(value: unknown, defaultValue: number) {
  const maybeNumber = Number(value);
  if (isNaN(maybeNumber)) {
    return defaultValue;
  }

  return maybeNumber;
}
