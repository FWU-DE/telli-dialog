import { BifrostProvider } from './types';

export function buildKeyName(
  provider: BifrostProvider,
  readableValue: string,
  uniqueValue: string,
): string {
  const readablePart = toReadableKeyNamePart(readableValue);
  const hashPart = hashString(`${provider}:${readableValue}:${uniqueValue}`).slice(0, 8);

  return `${provider}-${readablePart}-${hashPart}`;
}

function toReadableKeyNamePart(value: string): string {
  const normalizedValue = toKebabCase(getHostnameForUrl(value) ?? value);
  return normalizedValue.slice(0, 48) || 'default';
}

function getHostnameForUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.hostname;
  } catch {
    return undefined;
  }
}

function toKebabCase(value: string): string {
  const parts: string[] = [];
  let currentPart = '';

  for (const character of value.toLowerCase()) {
    if (isAsciiLetterOrDigit(character)) {
      currentPart += character;
      continue;
    }

    if (currentPart) {
      parts.push(currentPart);
      currentPart = '';
    }
  }

  if (currentPart) parts.push(currentPart);

  return parts.join('-');
}

function isAsciiLetterOrDigit(character: string): boolean {
  const charCode = character.charCodeAt(0);
  const isDigit = charCode >= 48 && charCode <= 57;
  const isLowercaseLetter = charCode >= 97 && charCode <= 122;
  return isDigit || isLowercaseLetter;
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
