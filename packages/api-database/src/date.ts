export function getDateOneYearFromNow(): Date {
  const now = new Date();
  const oneYearFromNow = new Date(now.setFullYear(now.getFullYear() + 1));
  return oneYearFromNow;
}

export function isDateBefore(date: Date, comparisonDate: Date): boolean {
  return date.getTime() < comparisonDate.getTime();
}
