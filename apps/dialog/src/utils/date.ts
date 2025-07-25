export function convertUnixTimestampToLocaleDate(
  unixTimestamp: number,
  timeZone: string = 'Europe/Berlin',
) {
  const date = new Date(unixTimestamp * 1000);
  const formatter = new Intl.DateTimeFormat('de-DE', {
    timeZone,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  return formatter.format(date).replace(/\//g, '.');
}

export function formatDateToDayMonthYear(date: Date, timeZone: string = 'Europe/Berlin'): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  };
  return new Intl.DateTimeFormat('de-DE', options).format(date);
}

export function formatDateToGermanTimestamp(
  date: Date,
  timeZone: string = 'Europe/Berlin',
): string {
  const formatter = new Intl.DateTimeFormat('de-DE', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return formatter.format(date);
}

export function getWeekNumber(date: Date, timeZone: string = 'Europe/Berlin'): number {
  const zonedDate = new Date(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date),
  );

  const day = zonedDate.getUTCDay();
  const nearestThursday = new Date(zonedDate);
  nearestThursday.setUTCDate(zonedDate.getUTCDate() + (3 - ((day + 6) % 7)));

  const firstThursday = new Date(Date.UTC(nearestThursday.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() + (3 - ((firstThursday.getUTCDay() + 6) % 7)),
  );

  return 1 + Math.round(((nearestThursday.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7);
}

export function getStartOfCurrentMonth(): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getEndOfCurrentMonth(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  date.setHours(23, 59, 59, 999);
  return date;
}
