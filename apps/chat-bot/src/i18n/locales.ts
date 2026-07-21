export const DEFAULT_LOCALE = 'de';

export const SUPPORTED_LOCALES = new Set(['de', 'en', 'fr', 'it', 'ar']);

/**
 * Single source of truth for filter languages that have a corresponding locale.
 * `SupportedFilterLanguage` is inferred from this object, and the reverse
 * locale -> filter language mapping is derived from it, so the two mappings
 * can never drift out of sync.
 */
const LOCALE_BY_FILTER_LANGUAGE = {
  german: 'de',
  english: 'en',
  arabic: 'ar',
  french: 'fr',
  italian: 'it',
} as const;

export type SupportedFilterLanguage = keyof typeof LOCALE_BY_FILTER_LANGUAGE;

export const FILTER_LANGUAGE_TO_LOCALE: Record<SupportedFilterLanguage, string> =
  LOCALE_BY_FILTER_LANGUAGE;

export const LOCALE_TO_FILTER_LANGUAGE: Record<string, SupportedFilterLanguage> =
  Object.fromEntries(
    Object.entries(LOCALE_BY_FILTER_LANGUAGE).map(([filterLanguage, locale]) => [
      locale,
      filterLanguage,
    ]),
  ) as Record<string, SupportedFilterLanguage>;
