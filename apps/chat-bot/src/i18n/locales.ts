import type { Language } from '@shared/db/schema';

export const DEFAULT_LOCALE = 'de';

export const SUPPORTED_LOCALES = new Set(['de', 'en', 'fr', 'it', 'ar']);

export const FILTER_LANGUAGE_TO_LOCALE: Record<string, string> = {
  german: 'de',
  english: 'en',
  arabic: 'ar',
  french: 'fr',
  italian: 'it',
};

export const LOCALE_TO_FILTER_LANGUAGE: Record<string, Language> = {
  de: 'german',
  en: 'english',
  ar: 'arabic',
  fr: 'french',
  it: 'italian',
};
