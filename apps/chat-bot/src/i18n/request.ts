import { getRequestConfig } from 'next-intl/server';
import { loadMessages } from './load-messages';

const SUPPORTED_LOCALES = new Set(['de', 'en', 'fr', 'it', 'ar']);
const DEFAULT_LOCALE = 'de';

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale =
    requestedLocale !== undefined && SUPPORTED_LOCALES.has(requestedLocale)
      ? requestedLocale
      : DEFAULT_LOCALE;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
