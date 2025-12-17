/**
 * Checks if a number is valid (not NaN, Infinity, null, or String) and positive.
 * @param value The number to check.
 * @returns True if the number is valid and positive, false otherwise.
 */
export function isValidPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
