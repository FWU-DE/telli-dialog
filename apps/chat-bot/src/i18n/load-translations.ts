type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(base: JsonObject, override: JsonObject): JsonObject {
  const result: JsonObject = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];

    if (isJsonObject(baseValue) && isJsonObject(value)) {
      result[key] = deepMerge(baseValue, value);
      continue;
    }

    result[key] = value;
  }

  return result;
}

/**
 * Loads locale translations and merges them on top of German fallback translations.
 * This prevents runtime failures when a non-default locale is incomplete.
 */
export async function loadTranslations(locale: string): Promise<JsonObject> {
  const fallbackMessages = (await import('../../messages/de.json')).default as JsonObject;

  if (locale === 'de') {
    return fallbackMessages;
  }

  try {
    const localeMessages = (await import(`../../messages/${locale}.json`)).default as JsonObject;
    return deepMerge(fallbackMessages, localeMessages);
  } catch {
    return fallbackMessages;
  }
}
